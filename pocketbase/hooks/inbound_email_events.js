onRecordCreate((e) => {
  try {
    const payload = e.record.get('payload') || {}

    const headersMap = {}
    if (payload.headers && Array.isArray(payload.headers)) {
      for (const h of payload.headers) {
        if (h.name)
          headersMap[String(h.name).toLowerCase()] = h.value !== undefined ? String(h.value) : ''
      }
    } else if (payload.headers && typeof payload.headers === 'object') {
      for (const key in payload.headers) {
        headersMap[String(key).toLowerCase()] =
          payload.headers[key] !== undefined ? String(payload.headers[key]) : ''
      }
    }

    const messageId = headersMap['message-id'] || ''
    const inReplyTo = headersMap['in-reply-to'] || ''

    const fromEmail = String(payload.from || e.record.getString('from_email') || '').toLowerCase()

    let toAddresses = []
    if (Array.isArray(payload.to)) {
      toAddresses = payload.to.map(String)
    } else if (typeof payload.to === 'string') {
      toAddresses = payload.to.split(',')
    }

    const toEmail = toAddresses.join(', ') || e.record.getString('to_email') || ''
    const subject = payload.subject || e.record.getString('subject') || ''
    const textBody = payload.text || e.record.getString('text_body') || ''
    const htmlBody = payload.html || e.record.getString('html_body') || ''

    if (!e.record.getString('message_id')) e.record.set('message_id', messageId)
    if (!e.record.getString('in_reply_to')) e.record.set('in_reply_to', inReplyTo)
    if (!e.record.getString('from_email')) e.record.set('from_email', fromEmail)
    if (!e.record.getString('to_email')) e.record.set('to_email', toEmail)
    if (!e.record.getString('subject')) e.record.set('subject', subject)
    if (!e.record.getString('text_body')) e.record.set('text_body', textBody)
    if (!e.record.getString('html_body')) e.record.set('html_body', htmlBody)

    const systemFrom = String(
      $os.getenv('RESEND_FROM') || $secrets.get('RESEND_FROM') || '',
    ).toLowerCase()

    const isAutoMessage = () => {
      if (systemFrom && fromEmail.includes(systemFrom)) return true
      if (/(no[-_.]?reply|donotreply|postmaster|mailer-daemon|bounce)/i.test(fromEmail)) return true
      const autoSubmitted = String(headersMap['auto-submitted'] || 'no').toLowerCase()
      if (autoSubmitted !== 'no') return true
      const precedence = String(headersMap['precedence'] || '').toLowerCase()
      if (['bulk', 'junk', 'list', 'auto_reply'].includes(precedence)) return true
      if (headersMap['x-auto-response-suppress'] !== undefined) return true
      if (headersMap['list-id'] !== undefined || headersMap['list-unsubscribe'] !== undefined)
        return true
      return false
    }

    if (isAutoMessage()) {
      e.record.set('processed', false)
      e.record.set('error', 'Ignored (loop prevention)')
      return e.next()
    }

    let ticketId = null
    let ticket = null

    const ticketRegex = /support\+([a-z0-9]+)@/i
    for (const address of toAddresses) {
      const match = address.match(ticketRegex)
      if (match && match[1]) {
        try {
          ticket = $app.findRecordById('tickets', match[1])
          ticketId = ticket.id
          break
        } catch (_) {}
      }
    }

    if (!ticket && inReplyTo) {
      const cleanRef = inReplyTo.replace(/^<|>$/g, '')
      try {
        const comment = $app.findFirstRecordByData('comments', 'message_id', cleanRef)
        ticketId = comment.getString('ticket')
        ticket = $app.findRecordById('tickets', ticketId)
      } catch (_) {
        try {
          const comment = $app.findFirstRecordByData('comments', 'message_id', inReplyTo)
          ticketId = comment.getString('ticket')
          ticket = $app.findRecordById('tickets', ticketId)
        } catch (_) {}
      }
    }

    if (!ticket) {
      e.record.set('processed', false)
      e.record.set('error', 'no_matching_ticket')
      return e.next()
    }

    e.record.set('matched_ticket', ticketId)

    let user = null
    let pureEmail = fromEmail
    let fromName = 'Client'
    const emailMatch = fromEmail.match(/(.*?)\s*<([^>]+)>/)
    if (emailMatch && emailMatch[2]) {
      pureEmail = emailMatch[2].trim()
      if (emailMatch[1]) {
        fromName = emailMatch[1].replace(/"/g, '').trim()
      }
    } else {
      const simpleMatch = fromEmail.match(/<([^>]+)>/)
      if (simpleMatch && simpleMatch[1]) {
        pureEmail = simpleMatch[1].trim()
      }
    }

    try {
      user = $app.findAuthRecordByEmail('users', pureEmail)
    } catch (_) {
      try {
        const usersCol = $app.findCollectionByNameOrId('users')
        user = new Record(usersCol)
        user.setEmail(pureEmail)
        user.setPassword($security.randomString(16))
        user.setVerified(true)
        user.set('role', 'client')
        user.set('name', fromName || pureEmail.split('@')[0])
        $app.save(user)
      } catch (userErr) {
        e.record.set('processed', false)
        e.record.set('error', 'Failed to create user: ' + userErr.message)
        return e.next()
      }
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

    const cleanBody = stripQuotedReply(textBody || htmlBody || '')

    const commentsCol = $app.findCollectionByNameOrId('comments')
    const comment = new Record(commentsCol)
    comment.set('ticket', ticketId)
    comment.set('author', user.id)
    comment.set('body', cleanBody || '[No text content]')
    comment.set('is_internal', false)
    comment.set('source', 'email')

    if (messageId) {
      comment.set('message_id', messageId.replace(/^<|>$/g, ''))
    }
    if (inReplyTo) {
      comment.set('in_reply_to', inReplyTo.replace(/^<|>$/g, ''))
    }

    if (payload.attachments && Array.isArray(payload.attachments)) {
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

      for (const att of payload.attachments) {
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

    const isRequester = ticket.getString('requester') === user.id
    if (isRequester) {
      const status = ticket.getString('status')
      if (status === 'resolved' || status === 'closed') {
        ticket.set('status', 'open')
        $app.save(ticket)
      }
    }

    e.record.set('processed', true)
    e.record.set('error', '')
  } catch (err) {
    e.record.set('processed', false)
    e.record.set('error', String(err.message || err))
    $app.logger().error('inbound_email_events error', 'error', err.message, 'stack', err.stack)
  }

  return e.next()
}, 'inbound_email_events')
