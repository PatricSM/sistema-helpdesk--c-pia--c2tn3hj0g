/**
 * Utilitário para envio de emails via Resend e log no PocketBase.
 */

module.exports = {
  sendEmail(app, options) {
    const apiKey =
      $os.getenv('RESEND_API_KEY') ||
      (typeof $secrets !== 'undefined' && $secrets.get('RESEND_API_KEY')) ||
      ''
    const fromEmail =
      $os.getenv('RESEND_FROM') ||
      (typeof $secrets !== 'undefined' && $secrets.get('RESEND_FROM')) ||
      'support@example.com'

    if (!apiKey) {
      app
        .logger()
        .warn(
          'missing_api_key',
          'message',
          String('RESEND_API_KEY not configured. Skipping email send.'),
        )
      return
    }

    let userStatus = 'ok'
    try {
      let pureEmail = String(options.to).toLowerCase()
      const match = pureEmail.match(/<([^>]+)>/)
      if (match && match[1]) pureEmail = match[1].trim()

      const user = app.findAuthRecordByEmail('users', pureEmail)
      userStatus = user.get('email_status') || 'ok'
    } catch (_) {
      // User not found, proceed
    }

    if (userStatus === 'bounced' || userStatus === 'complained') {
      app
        .logger()
        .warn(
          'email_skipped_status',
          'to',
          String(options.to || ''),
          'userStatus',
          String(userStatus),
        )
      try {
        const logCol = app.findCollectionByNameOrId('email_log')
        const logRecord = new Record(logCol)
        logRecord.set('direction', 'out')
        logRecord.set('to', String(options.to || ''))
        logRecord.set('from', String(fromEmail || ''))
        logRecord.set('subject', String(options.subject || ''))
        logRecord.set('status', 'skipped')
        logRecord.set('error', String(`Skipped due to ${userStatus} status`))
        if (options.ticketId) logRecord.set('ticket', String(options.ticketId))
        if (options.commentId) logRecord.set('comment', String(options.commentId))
        app.save(logRecord)
      } catch (e) {
        app
          .logger()
          .error(
            'email_log_skipped_save_failed',
            'error',
            String((e && e.message) || e),
            'stack',
            String((e && e.stack) || ''),
          )
      }
      return
    }

    let status = 'failed'
    let resendId = ''
    let errorMsg = ''
    let msgId = ''

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
        timeout: 120,
      })

      if (res.statusCode >= 200 && res.statusCode < 300) {
        status = 'queued'
        resendId = res.json?.id || ''
        msgId = res.json?.message_id || resendId

        if (options.commentId) {
          try {
            const comment = app.findRecordById('comments', options.commentId)
            comment.set('message_id', String(msgId))
            app.save(comment)
          } catch (err) {
            app
              .logger()
              .error(
                'failed_to_update_comment',
                'error',
                String(err),
                'commentId',
                String(options.commentId),
              )
          }
        }
      } else {
        status = 'failed'
        errorMsg = res.json?.message || `HTTP ${res.statusCode}`
        app
          .logger()
          .error(
            'resend_api_error',
            'error',
            String(errorMsg),
            'statusCode',
            String(res.statusCode),
          )
      }
    } catch (err) {
      status = 'failed'
      errorMsg = err.message || String(err)
      app
        .logger()
        .error(
          'failed_to_send_email',
          'error',
          String(err.message || err),
          'stack',
          String(err.stack || ''),
        )
    }

    try {
      app
        .logger()
        .info('email_log_save_attempt', 'to', String(options.to || ''), 'status', String(status))
      const emailLogCol = app.findCollectionByNameOrId('email_log')
      const logRecord = new Record(emailLogCol)
      logRecord.set('direction', 'out')
      logRecord.set('to', String(options.to || ''))
      logRecord.set('from', String(fromEmail || ''))
      logRecord.set('subject', String(options.subject || ''))
      logRecord.set('body_text', String(options.text || ''))
      logRecord.set('body_html', String(options.html || ''))
      logRecord.set('status', String(status))
      if (resendId) logRecord.set('resend_id', String(resendId))
      if (errorMsg) logRecord.set('error', String(errorMsg))
      if (options.ticketId) logRecord.set('ticket', String(options.ticketId))
      if (options.commentId) logRecord.set('comment', String(options.commentId))

      app.save(logRecord)
      app.logger().info('email_log_saved', 'recordId', String(logRecord.id))
    } catch (logErr) {
      app
        .logger()
        .error(
          'email_log_save_failed',
          'error',
          String((logErr && logErr.message) || logErr),
          'stack',
          String((logErr && logErr.stack) || ''),
          'to',
          String(options.to || ''),
          'subject',
          String(options.subject || ''),
        )
    }
  },

  replyToFor(ticketId) {
    const inboundDomain =
      $os.getenv('RESEND_INBOUND_DOMAIN') ||
      (typeof $secrets !== 'undefined' && $secrets.get('RESEND_INBOUND_DOMAIN')) ||
      'example.com'
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

  renderWelcome(user, resetUrl) {
    const name = user.get('name') || ''

    const html = `
      <h2>Bem-vindo ao nosso portal de suporte!</h2>
      <p>Olá${name ? ' ' + name : ''},</p>
      <p>Recebemos sua solicitação de suporte. Uma conta foi criada para você acompanhar seus chamados.</p>
      <p>Para acessar o portal, por favor defina sua senha clicando no botão abaixo:</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Definir senha</a>
      </p>
      <p>Ou copie e cole o link no seu navegador:<br/><a href="${resetUrl}">${resetUrl}</a></p>
    `
    const text = `Bem-vindo ao nosso portal de suporte!\n\nOlá${
      name ? ' ' + name : ''
    },\n\nRecebemos sua solicitação de suporte. Uma conta foi criada para você acompanhar seus chamados.\n\nPara acessar o portal, por favor defina sua senha acessando o link abaixo:\n${resetUrl}`

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
