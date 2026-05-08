onRecordCreateRequest((e) => {
  const ip = e.request.remoteAddr

  e.record.set('client_ip', ip)

  const honeypot = e.record.getString('honeypot')
  const loadedAt = e.record.getFloat('loaded_at')
  const embedKeyStr = e.record.getString('embed_key')
  const email = e.record.getString('email').trim().toLowerCase()
  const title = e.record.getString('title').trim()
  const description = e.record.getString('description').trim()

  // Rate Limit check
  let isRateLimited = false
  const limitCount = 5
  const windowMs = 60 * 60 * 1000 // 1 hour
  const now = new Date()
  const rlKey = `embed_${ip}`

  $app.runInTransaction((txApp) => {
    let bucket
    try {
      bucket = txApp.findFirstRecordByData('rate_limit_buckets', 'key', rlKey)
    } catch (_) {}

    if (bucket) {
      const windowStart = new Date(bucket.getString('window_start'))
      if (now.getTime() - windowStart.getTime() > windowMs) {
        bucket.set('count', 1)
        bucket.set('window_start', now.toISOString())
      } else {
        const count = bucket.getInt('count') + 1
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
    e.record.set('error', 'rate_limit')
    return e.next()
  }

  if (honeypot) {
    e.record.set('error', 'honeypot')
    return e.next()
  }

  const elapsedMs = Date.now() - loadedAt
  if (!loadedAt || elapsedMs < 2000 || Math.abs(elapsedMs) > 3600000) {
    e.record.set('error', 'time_check')
    return e.next()
  }

  let specificEmbedKey = null
  try {
    specificEmbedKey = $app.findFirstRecordByData('embed_keys', 'key', embedKeyStr)
  } catch (_) {}

  if (!specificEmbedKey || !specificEmbedKey.getBool('is_active')) {
    e.record.set('error', 'invalid_key')
    return e.next()
  }

  if (!email || !title || !description) {
    e.record.set('error', 'missing_fields')
    return e.next()
  }

  // Proceed to create user/ticket
  let user
  let userIsNew = false
  try {
    user = $app.findAuthRecordByEmail('users', email)
  } catch (_) {
    const usersCol = $app.findCollectionByNameOrId('users')
    user = new Record(usersCol)
    user.setEmail(email)
    user.setPassword($security.randomString(20))
    user.set('name', e.record.getString('name'))
    user.set('role', 'client')
    $app.save(user)
    userIsNew = true
  }

  const ticketsCol = $app.findCollectionByNameOrId('tickets')
  const ticket = new Record(ticketsCol)
  ticket.set('title', title)
  ticket.set('description', description)
  ticket.set('status', 'open')
  ticket.set('priority', 'medium')

  const defCategory = specificEmbedKey.get('default_category')
  if (defCategory) {
    ticket.set('category', defCategory)
  }

  const defTeam = specificEmbedKey.get('default_team')
  if (defTeam) {
    ticket.set('team', defTeam)
  }

  ticket.set('requester', user.id)
  ticket.set('source', 'embed')
  ticket.set('embed_key', specificEmbedKey.id)

  $app.save(ticket)

  e.record.set('ticket', ticket.id)
  e.record.set('processed', true)

  if (userIsNew) {
    try {
      const baseUrl =
        $os.getenv('EMBED_BASE_URL') || $os.getenv('VITE_EMBED_BASE_URL') || 'http://localhost:5173'
      const resetUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}`

      const emailHelper = require(__dirname + '/_email.js')
      const { html, text } = emailHelper.renderWelcome(user, resetUrl)

      emailHelper.sendEmail($app, {
        to: email,
        subject: 'Bem-vindo ao Suporte',
        html: html,
        text: text,
      })
    } catch (err) {
      console.error('Failed to send welcome email:', err)
    }
  }

  return e.next()
}, 'embed_submissions')
