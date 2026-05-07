routerAdd('OPTIONS', '/backend/v1/embed/tickets', (e) => {
  const origin = e.request.header.get('Origin') || e.requestInfo().headers['origin']
  if (!origin) {
    return e.forbiddenError('Origin required')
  }

  let isAuthorized = false
  try {
    const keys = $app.findRecordsByFilter('embed_keys', 'is_active = true', '', 1000, 0)
    for (const key of keys) {
      const allowed = key.get('allowed_origins') || []
      if (allowed.length === 0 || allowed.includes(origin)) {
        isAuthorized = true
        break
      }
    }
  } catch (_) {}

  if (!isAuthorized) {
    return e.forbiddenError('Origin not allowed')
  }

  try {
    e.response.header().set('Access-Control-Allow-Origin', origin)
    e.response.header().set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    e.response.header().set('Access-Control-Allow-Headers', 'Content-Type')
    e.response.header().set('Access-Control-Max-Age', '600')
    e.response.header().set('Vary', 'Origin')
  } catch (err) {}

  return e.noContent(204)
})

routerAdd('POST', '/backend/v1/embed/tickets', (e) => {
  const body = e.requestInfo().body || {}
  const origin = e.request.header.get('Origin') || e.requestInfo().headers['origin']

  let originAllowed = false
  const embedKeyStr = body.embed_key
  let specificEmbedKey = null

  if (embedKeyStr) {
    try {
      specificEmbedKey = $app.findFirstRecordByData('embed_keys', 'key', embedKeyStr)
      if (specificEmbedKey.get('is_active')) {
        const allowed = specificEmbedKey.get('allowed_origins') || []
        if (allowed.length === 0 || (origin && allowed.includes(origin))) {
          originAllowed = true
        }
      }
    } catch (_) {}
  }

  if (origin && !originAllowed) {
    try {
      const keys = $app.findRecordsByFilter('embed_keys', 'is_active = true', '', 1000, 0)
      for (const key of keys) {
        const allowed = key.get('allowed_origins') || []
        if (allowed.length === 0 || allowed.includes(origin)) {
          originAllowed = true
          break
        }
      }
    } catch (_) {}
  }

  if (originAllowed && origin) {
    try {
      e.response.header().set('Access-Control-Allow-Origin', origin)
      e.response.header().set('Vary', 'Origin')
    } catch (err) {}
  }

  const ip = e.request.remoteAddr

  const limitCount = 5
  const windowMs = 60 * 60 * 1000 // 1 hour
  const now = new Date()
  const rlKey = `embed_${ip}`

  let isRateLimited = false

  $app.runInTransaction((txApp) => {
    let bucket
    try {
      bucket = txApp.findFirstRecordByData('rate_limit_buckets', 'key', rlKey)
    } catch (_) {}

    if (bucket) {
      const windowStart = new Date(bucket.get('window_start'))
      if (now.getTime() - windowStart.getTime() > windowMs) {
        bucket.set('count', 1)
        bucket.set('window_start', now.toISOString())
      } else {
        const count = bucket.get('count') + 1
        if (count > limitCount) {
          isRateLimited = true
        } else {
          bucket.set('count', count)
        }
      }
      if (!isRateLimited) {
        txApp.save(bucket)
      }
    } else {
      const col = txApp.findCollectionByNameOrId('rate_limit_buckets')
      bucket = new Record(col)
      bucket.set('key', rlKey)
      bucket.set('count', 1)
      bucket.set('window_start', now.toISOString())
      txApp.save(bucket)
    }
  })

  if (isRateLimited) {
    return e.tooManyRequestsError('Rate limit exceeded. Please try again later.')
  }

  const captchaToken = String(body.captcha_token || '').trim()
  if (!captchaToken) {
    return e.badRequestError('captcha_token required')
  }

  const turnstileSecret = $os.getenv('TURNSTILE_SECRET')
  if (!turnstileSecret) {
    return e.internalServerError('Captcha not configured')
  }

  try {
    const res = $http.send({
      url: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(captchaToken)}&remoteip=${encodeURIComponent(ip)}`,
      timeout: 10,
    })

    if (res.statusCode !== 200 || !res.json || res.json.success !== true) {
      return e.forbiddenError('Captcha verification failed')
    }
  } catch (err) {
    console.error('Captcha verification error:', err)
    return e.internalServerError('Captcha verification error')
  }

  if (!embedKeyStr) return e.badRequestError('Missing embed_key')

  if (!specificEmbedKey) {
    return e.badRequestError('Invalid embed_key')
  }

  if (!specificEmbedKey.get('is_active')) {
    return e.badRequestError('Embed key is inactive')
  }

  if (origin) {
    const allowed = specificEmbedKey.get('allowed_origins') || []
    if (allowed.length > 0 && !allowed.includes(origin)) {
      return e.forbiddenError('Origin not allowed')
    }
  }

  const embedKey = specificEmbedKey

  const requesterEmail = String(body.email || '')
    .trim()
    .toLowerCase()
  const requesterName = String(body.name || '').trim()
  if (!requesterEmail) return e.badRequestError('Email is required')
  if (!body.title) return e.badRequestError('Title is required')
  if (!body.description) return e.badRequestError('Description is required')

  let user
  try {
    user = $app.findAuthRecordByEmail('users', requesterEmail)
  } catch (_) {
    const usersCol = $app.findCollectionByNameOrId('users')
    user = new Record(usersCol)
    user.setEmail(requesterEmail)
    user.setPassword($security.randomString(12) + 'A1@')
    user.set('name', requesterName)
    user.set('role', 'client')
    $app.save(user)
  }

  const ticketsCol = $app.findCollectionByNameOrId('tickets')
  const ticket = new Record(ticketsCol)
  ticket.set('title', body.title)
  ticket.set('description', body.description)
  ticket.set('status', 'open')
  ticket.set('priority', body.priority || 'medium')

  if (embedKey.get('default_category')) {
    ticket.set('category', embedKey.get('default_category'))
  } else {
    try {
      const firstCat = $app.findFirstRecordByFilter('categories', "id != ''", 'created')
      ticket.set('category', firstCat.id)
    } catch (_) {}
  }

  if (embedKey.get('default_team')) {
    ticket.set('team', embedKey.get('default_team'))
  }

  ticket.set('requester', user.id)
  ticket.set('source', 'embed')
  ticket.set('embed_key', embedKey.id)

  $app.save(ticket)

  return e.json(200, { success: true, ticketId: ticket.id })
})
