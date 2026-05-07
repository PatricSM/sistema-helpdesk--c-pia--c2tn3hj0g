routerAdd('OPTIONS', '/backend/v1/embed/tickets', (e) => {
  const origin = e.request.header.get('Origin') || e.requestInfo().headers['origin'] || '*'

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
  const origin = e.request.header.get('Origin') || e.requestInfo().headers['origin'] || '*'

  try {
    e.response.header().set('Access-Control-Allow-Origin', origin)
    e.response.header().set('Vary', 'Origin')
  } catch (err) {}

  const body = e.requestInfo().body || {}
  const embedKeyStr = body.embed_key

  if (!embedKeyStr) return e.badRequestError('Missing embed_key')

  let specificEmbedKey = null
  try {
    specificEmbedKey = $app.findFirstRecordByData('embed_keys', 'key', embedKeyStr)
  } catch (_) {
    return e.badRequestError('Invalid embed_key')
  }

  if (!specificEmbedKey || !specificEmbedKey.get('is_active')) {
    return e.badRequestError('Embed key is inactive')
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

  const honeypot = String(body.honeypot || '').trim()
  if (honeypot) {
    $app.logger().info('embed: honeypot triggered', 'ip', ip)
    return e.json(200, { success: true, ticketId: 'discarded' })
  }

  const loadedAt = Number(body.loaded_at)
  if (!loadedAt) {
    $app.logger().info('embed: time check failed', 'ip', ip, 'reason', 'missing loaded_at')
    return e.json(200, { success: true, ticketId: 'discarded' })
  }

  const elapsedMs = Date.now() - loadedAt
  if (elapsedMs < 2000) {
    $app.logger().info('embed: time check failed', 'ip', ip, 'elapsedMs', elapsedMs)
    return e.json(200, { success: true, ticketId: 'discarded' })
  }

  if (Math.abs(elapsedMs) > 3600000) {
    return e.badRequestError('Invalid form session')
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
  let userIsNew = false
  try {
    user = $app.findAuthRecordByEmail('users', requesterEmail)
  } catch (_) {
    const usersCol = $app.findCollectionByNameOrId('users')
    user = new Record(usersCol)
    user.setEmail(requesterEmail)
    user.setPassword($security.randomString(20))
    user.set('name', requesterName)
    user.set('role', 'client')
    $app.save(user)
    userIsNew = true
  }

  const ticketsCol = $app.findCollectionByNameOrId('tickets')
  const ticket = new Record(ticketsCol)
  ticket.set('title', body.title)
  ticket.set('description', body.description)
  ticket.set('status', 'open')
  ticket.set('priority', body.priority || 'medium')

  ticket.set('category', embedKey.get('default_category'))

  if (embedKey.get('default_team')) {
    ticket.set('team', embedKey.get('default_team'))
  }

  ticket.set('requester', user.id)
  ticket.set('source', 'embed')
  ticket.set('embed_key', embedKey.id)

  $app.save(ticket)

  if (userIsNew) {
    try {
      const baseUrl =
        $os.getenv('EMBED_BASE_URL') || $os.getenv('VITE_EMBED_BASE_URL') || 'http://localhost:5173'
      const resetUrl = `${baseUrl}/login?email=${encodeURIComponent(requesterEmail)}`

      const emailHelper = require(__dirname + '/_email.js')
      const { html, text } = emailHelper.renderWelcome(user, resetUrl)

      emailHelper.sendEmail($app, {
        to: requesterEmail,
        subject: 'Bem-vindo ao Suporte',
        html: html,
        text: text,
      })
    } catch (err) {
      console.error('Failed to send welcome email:', err)
    }
  }

  return e.json(200, { success: true, ticketId: ticket.id })
})
