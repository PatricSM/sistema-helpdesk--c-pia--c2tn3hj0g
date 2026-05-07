/**
 * Utilitário para envio de emails via Resend e log no PocketBase.
 */

module.exports = {
  sendEmail(app, options) {
    const apiKey = $os.getenv('RESEND_API_KEY')
    const fromEmail = $os.getenv('RESEND_FROM') || 'support@example.com'

    if (!apiKey) {
      console.warn('RESEND_API_KEY not configured. Skipping email send.')
      return
    }

    let status = 'failed'
    let resendId = ''
    let errorMsg = ''

    try {
      const res = $http.send({
        url: 'https://api.resend.com/emails',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
        }),
        timeout: 15,
      })

      if (res.statusCode >= 200 && res.statusCode < 300) {
        status = 'queued'
        resendId = res.json?.id || ''
      } else {
        status = 'failed'
        errorMsg = res.json?.message || `HTTP ${res.statusCode}`
        console.error('Resend API Error:', errorMsg)
      }
    } catch (err) {
      status = 'failed'
      errorMsg = err.message || String(err)
      console.error('Failed to send email:', err)
    }

    try {
      const emailLogCol = app.findCollectionByNameOrId('email_log')
      const logRecord = new Record(emailLogCol)
      logRecord.set('direction', 'out')
      logRecord.set('to', options.to)
      logRecord.set('from', fromEmail)
      logRecord.set('subject', options.subject || '')
      logRecord.set('body_text', options.text || '')
      logRecord.set('body_html', options.html || '')
      logRecord.set('status', status)
      if (resendId) logRecord.set('resend_id', resendId)
      if (errorMsg) logRecord.set('error', errorMsg)
      if (options.ticketId) logRecord.set('ticket', options.ticketId)

      app.save(logRecord)
    } catch (logErr) {
      console.error('Failed to log email:', logErr)
    }
  },

  replyToFor(ticketId) {
    const inboundDomain = $os.getenv('RESEND_INBOUND_DOMAIN') || 'example.com'
    return `support+${ticketId}@${inboundDomain}`
  },

  renderTicketCreated(ticket, requester) {
    const title = ticket.get('title') || 'Sem título'
    const desc = ticket.get('description') || ''
    const reqName = requester.get('name') || ''

    const html = `
      <h2>Recebemos o seu chamado: ${title}</h2>
      <p>Olá${reqName ? ' ' + reqName : ''},</p>
      <p>Seu chamado foi criado com sucesso e em breve um de nossos agentes irá analisá-lo.</p>
      <hr />
      <h3>Descrição do chamado</h3>
      <p>${desc.replace(/\n/g, '<br/>')}</p>
    `
    const text = `Recebemos o seu chamado: ${title}\n\nOlá${
      reqName ? ' ' + reqName : ''
    },\nSeu chamado foi criado com sucesso e em breve um de nossos agentes irá analisá-lo.\n\nDescrição do chamado:\n${desc}`

    return { html, text }
  },

  renderTicketAssigned(ticket, assignee) {
    const title = ticket.get('title') || 'Sem título'
    const desc = ticket.get('description') || ''
    const name = assignee.get('name') || ''

    const html = `
      <h2>Um chamado foi atribuído a você: ${title}</h2>
      <p>Olá${name ? ' ' + name : ''},</p>
      <p>Um novo chamado foi criado e atribuído a você.</p>
      <hr />
      <h3>Descrição do chamado</h3>
      <p>${desc.replace(/\n/g, '<br/>')}</p>
    `
    const text = `Um chamado foi atribuído a você: ${title}\n\nOlá${
      name ? ' ' + name : ''
    },\nUm novo chamado foi criado e atribuído a você.\n\nDescrição do chamado:\n${desc}`

    return { html, text }
  },

  renderTicketReply(ticket, comment, author) {
    const title = ticket.get('title') || 'Sem título'
    const body = comment.get('body') || ''
    const authorName = author.get('name') || 'Nossa equipe'

    const html = `
      <h2>Nova resposta no chamado: ${title}</h2>
      <p><strong>${authorName}</strong> respondeu:</p>
      <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin-left: 0;">
        ${body.replace(/\n/g, '<br/>')}
      </blockquote>
      <p>Para responder, responda a este email ou acesse o painel de suporte.</p>
    `
    const text = `Nova resposta no chamado: ${title}\n\n${authorName} respondeu:\n\n${body}\n\nPara responder, responda a este email ou acesse o painel de suporte.`

    return { html, text }
  },
}
