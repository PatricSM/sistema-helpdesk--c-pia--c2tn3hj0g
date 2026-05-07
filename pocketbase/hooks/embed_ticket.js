routerAdd('POST', '/backend/v1/embed/tickets', (e) => {
  const body = e.requestInfo().body || {}
  const { embed_key, captcha_token, email, name, subject, description } = body

  if (!embed_key || !email || !name || !subject || !description) {
    return e.badRequestError('Missing required fields')
  }

  const origin = e.request.header.get('Origin') || ''

  let keyRecord
  try {
    keyRecord = $app.findFirstRecordByData('embed_keys', 'key', embed_key)
  } catch (err) {
    return e.badRequestError('Invalid embed key')
  }

  if (!keyRecord.getBool('is_active')) {
    return e.badRequestError('Embed key is inactive')
  }

  let allowedOrigins = keyRecord.get('allowed_origins') || []
  if (typeof allowedOrigins === 'string') {
    try {
      allowedOrigins = JSON.parse(allowedOrigins)
    } catch (_) {
      allowedOrigins = []
    }
  }

  if (allowedOrigins.length > 0 && !allowedOrigins.includes('*')) {
    if (!origin || !allowedOrigins.includes(origin)) {
      return e.forbiddenError('Origin not allowed')
    }
  }

  if (captcha_token) {
    try {
      const secret =
        $secrets.get('TURNSTILE_SECRET') ||
        $os.getenv('TURNSTILE_SECRET') ||
        '1x0000000000000000000000000000000AA'
      const res = $http.send({
        url: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(captcha_token)}`,
        timeout: 10,
      })
      if (res.statusCode === 200 && res.json && res.json.success === false) {
        return e.badRequestError('Captcha verification failed')
      }
    } catch (err) {
      // Ignore network errors to not break the flow
    }
  }

  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString().replace('T', ' ')
    const recentTickets = $app.findRecordsByFilter(
      'tickets',
      `created >= '${oneHourAgo}' && requester.email = '${email}'`,
      '-created',
      10,
      0,
    )
    if (recentTickets && recentTickets.length >= 5) {
      return e.badRequestError('Rate limit exceeded')
    }
  } catch (err) {}

  let user
  try {
    user = $app.findAuthRecordByEmail('users', email)
  } catch (_) {
    try {
      const usersCol = $app.findCollectionByNameOrId('users')
      user = new Record(usersCol)
      user.setEmail(email)
      user.setPassword($security.randomString(16))
      user.setVerified(true)
      user.set('name', name)
      user.set('role', 'client')
      $app.save(user)
    } catch (err) {
      return e.badRequestError('Failed to create user')
    }
  }

  let ticket
  try {
    const ticketsCol = $app.findCollectionByNameOrId('tickets')
    ticket = new Record(ticketsCol)
    ticket.set('title', subject)
    ticket.set('description', description)
    ticket.set('status', 'open')
    ticket.set('priority', 'medium')
    ticket.set('source', 'embed')
    ticket.set('category', keyRecord.get('default_category'))
    ticket.set('requester', user.id)
    ticket.set('embed_key', keyRecord.id)
    const defaultTeam = keyRecord.get('default_team')
    if (defaultTeam) {
      ticket.set('team', defaultTeam)
    }
    $app.save(ticket)
  } catch (err) {
    return e.internalServerError('Failed to create ticket')
  }

  e.response.header().set('Access-Control-Allow-Origin', origin || '*')

  return e.json(200, { ticket_id: ticket.id, message: 'Recebemos seu chamado' })
})
