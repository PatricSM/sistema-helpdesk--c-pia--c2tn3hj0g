onRecordCreate((e) => {
  try {
    const payload = e.record.get('payload') || {}
    const eventType = payload.type || e.record.getString('event_type') || ''
    const data = payload.data || {}
    const resendId = data.email_id || data.id || e.record.getString('email_id') || ''

    let toEmail = e.record.getString('to_email')
    if (!toEmail && data.to) {
      toEmail = Array.isArray(data.to) ? data.to[0] : data.to
    }

    if (!e.record.getString('event_type')) e.record.set('event_type', eventType)
    if (!e.record.getString('email_id')) e.record.set('email_id', resendId)
    if (!e.record.getString('to_email')) e.record.set('to_email', String(toEmail || ''))

    if (!resendId) {
      e.record.set('processed', false)
      e.record.set('error', 'No email_id in payload')
      return e.next()
    }

    let statusToSet = ''
    let emailStatusToSet = ''

    if (eventType === 'email.sent') {
      statusToSet = 'sent'
    } else if (eventType === 'email.delivered') {
      statusToSet = 'delivered'
    } else if (eventType === 'email.bounced') {
      statusToSet = 'bounced'
      emailStatusToSet = 'bounced'
    } else if (eventType === 'email.complained') {
      statusToSet = 'failed'
      emailStatusToSet = 'complained'
    } else if (eventType === 'email.delivery_delayed') {
      statusToSet = 'queued'
    }

    if (statusToSet) {
      try {
        const emailLog = $app.findFirstRecordByData('email_log', 'resend_id', resendId)
        emailLog.set('status', statusToSet)
        $app.save(emailLog)

        if (emailStatusToSet && toEmail) {
          try {
            let pureEmail = String(toEmail).toLowerCase()
            const match = pureEmail.match(/<([^>]+)>/)
            if (match && match[1]) pureEmail = match[1].trim()

            const user = $app.findAuthRecordByEmail('users', pureEmail)
            user.set('email_status', emailStatusToSet)
            user.set('last_bounce_at', new Date().toISOString())
            $app.save(user)
          } catch (_) {
            // User not found, ignore
          }
        }
      } catch (_) {
        $app.logger().warn('Webhook Delivery Hook: Email log not found', 'resend_id', resendId)
      }
    }

    e.record.set('processed', true)
    e.record.set('error', '')
  } catch (err) {
    e.record.set('processed', false)
    e.record.set('error', String(err.message || err))
    $app.logger().error('resend_webhook_events error', 'error', err.message)
  }

  return e.next()
}, 'resend_webhook_events')
