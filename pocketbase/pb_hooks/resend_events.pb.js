routerAdd('POST', '/backend/v1/webhook/resend', (e) => {
  const secret = $os.getenv('RESEND_WEBHOOK_SECRET') || $secrets.get('RESEND_WEBHOOK_SECRET')
  if (!secret) {
    return e.unauthorizedError('Webhook secret not configured.')
  }

  const id =
    e.request.header.get('svix-id') ||
    e.request.header.get('webhook-id') ||
    e.request.header.get('resend-signature-id')
  const timestamp =
    e.request.header.get('svix-timestamp') ||
    e.request.header.get('webhook-timestamp') ||
    e.request.header.get('resend-signature-timestamp')
  const signatures =
    e.request.header.get('svix-signature') ||
    e.request.header.get('webhook-signature') ||
    e.request.header.get('resend-signature')

  if (!id || !timestamp || !signatures) {
    return e.unauthorizedError('Missing signature headers.')
  }

  const now = Math.floor(Date.now() / 1000)
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return e.unauthorizedError('Stale or missing timestamp.')
  }

  let rawBody = ''
  if (typeof e.getRawBody === 'function') {
    rawBody = e.getRawBody()
  } else if (e.requestInfo().rawBody) {
    rawBody = e.requestInfo().rawBody
  } else {
    rawBody = e.request.header.get('x-raw-body') || ''
  }

  const signedPayload = `${id}.${timestamp}.${rawBody}`

  let secretKey = secret
  if (secretKey.startsWith('whsec_')) {
    secretKey = secretKey.split('_')[1]
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const lookup = new Uint8Array(256)
    for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i
    const safeBase64 = secretKey.replace(/=/g, '').replace(/\s/g, '')
    let decoded = ''
    for (let i = 0; i < safeBase64.length; i += 4) {
      let e1 = lookup[safeBase64.charCodeAt(i)]
      let e2 = lookup[safeBase64.charCodeAt(i + 1)]
      let e3 = lookup[safeBase64.charCodeAt(i + 2)]
      let e4 = lookup[safeBase64.charCodeAt(i + 3)]
      decoded += String.fromCharCode((e1 << 2) | (e2 >> 4))
      if (e3 !== undefined) decoded += String.fromCharCode(((e2 & 15) << 4) | (e3 >> 2))
      if (e4 !== undefined) decoded += String.fromCharCode(((e3 & 3) << 6) | (e4 & 63))
    }
    secretKey = decoded
  }

  const expectedHex = $security.hs256(signedPayload, secretKey)
  let expectedBytes = ''
  for (let i = 0; i < expectedHex.length; i += 2) {
    expectedBytes += String.fromCharCode(parseInt(expectedHex.substr(i, 2), 16))
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let expectedSigBase64 = ''
  for (let i = 0; i < expectedBytes.length; i += 3) {
    const c1 = expectedBytes.charCodeAt(i) & 0xff
    const c2 = i + 1 < expectedBytes.length ? expectedBytes.charCodeAt(i + 1) & 0xff : 0
    const c3 = i + 2 < expectedBytes.length ? expectedBytes.charCodeAt(i + 2) & 0xff : 0
    const t = (c1 << 16) | (c2 << 8) | c3
    expectedSigBase64 += chars[(t >> 18) & 0x3f]
    expectedSigBase64 += chars[(t >> 12) & 0x3f]
    expectedSigBase64 += i + 1 < expectedBytes.length ? chars[(t >> 6) & 0x3f] : '='
    expectedSigBase64 += i + 2 < expectedBytes.length ? chars[t & 0x3f] : '='
  }

  const passedSignatures = signatures.split(' ').map((s) => s.split(',')[1] || s)
  let isValid = false
  for (const sig of passedSignatures) {
    if (typeof $security.equal === 'function') {
      if ($security.equal(sig, expectedSigBase64)) {
        isValid = true
        break
      }
    } else if (sig === expectedSigBase64) {
      isValid = true
      break
    }
  }

  if (!isValid) {
    return e.unauthorizedError('Invalid signature.')
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
