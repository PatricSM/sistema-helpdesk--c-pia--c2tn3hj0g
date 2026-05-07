routerAdd('POST', '/api/inbound/email', (e) => {
  try {
    const secret = $os.getenv('RESEND_WEBHOOK_SECRET') || $secrets.get('RESEND_WEBHOOK_SECRET')
    if (!secret) {
      return e.unauthorizedError('Webhook secret not configured.')
    }

    try {
      const wh = require(__hooks + '/_webhooks.js')
      wh.verifySvixSignature(e, secret)
    } catch (err) {
      $app.logger().warn('Signature validation failed', 'error', err.message)
      return e.unauthorizedError(err.message)
    }

    const body = e.requestInfo().body || {}

    const createEmailLog = (data) => {
      try {
        const logCol = $app.findCollectionByNameOrId('email_log')
        const log = new Record(logCol)
        log.set('direction', 'in')
        if (data.to) log.set('to', Array.isArray(data.to) ? data.to.join(', ') : String(data.to))
        if (data.from) log.set('from', String(data.from))
        if (data.subject) log.set('subject', String(data.subject))
        if (data.text) log.set('body_text', String(data.text))
        if (data.html) log.set('body_html', String(data.html))
        if (data.ticketId) log.set('ticket', data.ticketId)
        if (data.commentId) log.set('comment', data.commentId)
        log.set('status', data.status || 'delivered')
        if (data.error) log.set('error', String(data.error))
        $app.save(log)
      } catch (err) {
        $app.logger().error('Failed to log inbound email', 'error', err.message)
      }
    }

    const headersMap = {}
    if (body.headers && Array.isArray(body.headers)) {
      for (const h of body.headers) {
        if (h.name)
          headersMap[String(h.name).toLowerCase()] = h.value !== undefined ? String(h.value) : ''
      }
    } else if (body.headers && typeof body.headers === 'object') {
      for (const key in body.headers) {
        headersMap[String(key).toLowerCase()] =
          body.headers[key] !== undefined ? String(body.headers[key]) : ''
      }
    }

    const inReplyTo = headersMap['in-reply-to'] || ''
    const messageId = headersMap['message-id'] || ''

    const isAutoMessage = (headers, fromAddr, sysFrom) => {
      if (sysFrom && fromAddr.includes(sysFrom)) return true
      if (/(no[-_.]?reply|donotreply|postmaster|mailer-daemon|bounce)/i.test(fromAddr)) return true

      const autoSubmitted = String(headers['auto-submitted'] || 'no').toLowerCase()
      if (autoSubmitted !== 'no') return true

      const precedence = String(headers['precedence'] || '').toLowerCase()
      if (['bulk', 'junk', 'list', 'auto_reply'].includes(precedence)) return true

      if (headers['x-auto-response-suppress'] !== undefined) return true
      if (headers['list-id'] !== undefined || headers['list-unsubscribe'] !== undefined) return true

      return false
    }

    const fromAddress = String(body.from || '').toLowerCase()
    const systemFrom = String(
      $os.getenv('RESEND_FROM') || $secrets.get('RESEND_FROM') || '',
    ).toLowerCase()

    if (isAutoMessage(headersMap, fromAddress, systemFrom)) {
      createEmailLog({ ...body, status: 'failed', error: 'Loop prevention' })
      return e.json(200, { message: 'Ignored (loop prevention)' })
    }

    let toAddresses = []
    if (Array.isArray(body.to)) {
      toAddresses = body.to.map(String)
    } else if (typeof body.to === 'string') {
      toAddresses = body.to.split(',')
    }

    let ticketId = null
    const ticketRegex = /support\+([a-z0-9]+)@/i
    for (const address of toAddresses) {
      const match = address.match(ticketRegex)
      if (match && match[1]) {
        ticketId = match[1]
        break
      }
    }

    if (!ticketId) {
      createEmailLog({ ...body, status: 'failed', error: 'No ticket ID found in to addresses' })
      return e.badRequestError('No ticket ID found')
    }

    let ticket
    try {
      ticket = $app.findRecordById('tickets', ticketId)
    } catch (_) {
      createEmailLog({ ...body, status: 'failed', error: 'Ticket not found' })
      return e.badRequestError('Invalid ticket ID')
    }

    let user
    try {
      let pureEmail = fromAddress
      const emailMatch = fromAddress.match(/<([^>]+)>/)
      if (emailMatch && emailMatch[1]) {
        pureEmail = emailMatch[1].trim()
      }
      user = $app.findAuthRecordByEmail('users', pureEmail)
    } catch (_) {
      createEmailLog({ ...body, ticketId, status: 'failed', error: 'Sender not found' })
      return e.forbiddenError('Sender unknown')
    }

    const isRequester = ticket.get('requester') === user.id
    const isAgentOrAdmin = user.get('role') === 'agent' || user.get('role') === 'admin'

    if (!isRequester && !isAgentOrAdmin) {
      createEmailLog({
        ...body,
        ticketId,
        status: 'failed',
        error: 'Sender unauthorized for this ticket',
      })
      return e.forbiddenError('Sender unauthorized')
    }

    function stripQuotedReply(text) {
      if (!text) return ''
      const lines = String(text).split(/\r?\n/)
      const out = []
      const quoteMarkers = [
        /^On\s.*wrote:$/i,
        /^Em\s.*escreveu:$/i,
        /^-+Original Message-+/i,
        /^From:\s/i,
      ]
      for (const line of lines) {
        if (quoteMarkers.some((regex) => regex.test(line.trim()))) {
          break
        }
        out.push(line)
      }
      return out.join('\n').trim()
    }

    const cleanBody = stripQuotedReply(body.text || body.html || '')

    const commentsCol = $app.findCollectionByNameOrId('comments')
    const comment = new Record(commentsCol)
    comment.set('ticket', ticketId)
    comment.set('author', user.id)
    comment.set('body', cleanBody || '[No text content]')
    comment.set('is_internal', false)
    comment.set('source', 'email')
    if (messageId) {
      const cleanMsgId = messageId.replace(/^<|>$/g, '')
      comment.set('message_id', cleanMsgId)
    }
    if (inReplyTo) {
      const cleanRef = inReplyTo.replace(/^<|>$/g, '')
      try {
        $app.findFirstRecordByData('comments', 'message_id', cleanRef)
        comment.set('in_reply_to', cleanRef)
      } catch (_) {
        try {
          $app.findFirstRecordByData('comments', 'message_id', inReplyTo)
          comment.set('in_reply_to', inReplyTo)
        } catch (_) {}
      }
    }

    if (body.attachments && Array.isArray(body.attachments)) {
      const files = []

      function decodeBase64(b64) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
        const lookup = new Uint8Array(256)
        for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i

        const safeBase64 = b64.replace(/=/g, '').replace(/\s/g, '')
        const bufferLength = safeBase64.length * 0.75
        const bytes = new Uint8Array(bufferLength)
        let p = 0,
          e1,
          e2,
          e3,
          e4

        for (let i = 0; i < safeBase64.length; i += 4) {
          e1 = lookup[safeBase64.charCodeAt(i)]
          e2 = lookup[safeBase64.charCodeAt(i + 1)]
          e3 = lookup[safeBase64.charCodeAt(i + 2)]
          e4 = lookup[safeBase64.charCodeAt(i + 3)]

          bytes[p++] = (e1 << 2) | (e2 >> 4)
          if (e3 !== undefined) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2)
          if (e4 !== undefined) bytes[p++] = ((e3 & 3) << 6) | (e4 & 63)
        }
        return bytes
      }

      for (const att of body.attachments) {
        if (att.content && att.filename) {
          try {
            const bytes = decodeBase64(String(att.content))
            const file = $filesystem.fileFromBytes(bytes, String(att.filename))
            files.push(file)
          } catch (err) {
            $app.logger().error('Attachment decode failed', 'error', err.message)
          }
        }
      }
      if (files.length > 0) {
        comment.set('attachments', files)
      }
    }

    $app.save(comment)

    if (isRequester) {
      const status = ticket.get('status')
      if (status === 'resolved' || status === 'closed') {
        ticket.set('status', 'open')
        $app.save(ticket)
      }
    }

    createEmailLog({ ...body, ticketId, commentId: comment.id, status: 'delivered' })

    return e.json(200, { success: true, commentId: comment.id })
  } catch (err) {
    $app.logger().error('Inbound email error', 'error', err.message, 'stack', err.stack)
    return e.internalServerError('Internal error processing email')
  }
})
