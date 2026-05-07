routerAdd('POST', '/backend/v1/webhook/resend', (e) => {
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
  const eventType = body.type
  const data = body.data || {}
  const resendId = data.email_id || data.id

  if (!resendId) {
    return e.json(200, { success: true, message: 'No ID to process' })
  }

  let statusToSet = ''
  let emailStatusToSet = ''

  if (eventType === 'email.delivered') {
    statusToSet = 'delivered'
  } else if (eventType === 'email.bounced') {
    statusToSet = 'bounced'
    emailStatusToSet = 'bounced'
  } else if (eventType === 'email.complained') {
    statusToSet = 'failed'
    emailStatusToSet = 'complained'
  }

  if (statusToSet) {
    try {
      const emailLog = $app.findFirstRecordByData('email_log', 'resend_id', resendId)
      emailLog.set('status', statusToSet)
      $app.save(emailLog)

      if (emailStatusToSet && data.to && data.to[0]) {
        try {
          const toEmail = String(data.to[0]).toLowerCase()
          let pureEmail = toEmail
          const match = toEmail.match(/<([^>]+)>/)
          if (match && match[1]) pureEmail = match[1].trim()

          const user = $app.findAuthRecordByEmail('users', pureEmail)
          user.set('email_status', emailStatusToSet)
          user.set('last_bounce_at', new Date().toISOString())
          $app.save(user)
        } catch (_) {
          // User not found or could not be updated
        }
      }
    } catch (_) {
      // Email log not found, ignore
    }
  }

  return e.json(200, { success: true })
})
