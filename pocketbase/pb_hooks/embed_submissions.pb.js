onRecordCreate((e) => {
  try {
    const embedKeyStr = String(e.record.get('embed_key') || '').trim()
    $app
      .logger()
      .info(
        'embed_submissions hook fired',
        'recordId',
        String(e.record.id || 'new'),
        'embed_key',
        embedKeyStr,
      )

    let ip = 'unknown'
    try {
      ip = String(e.request.remoteAddr || '')
      if (!ip || ip === 'undefined') {
        ip = 'unknown'
      }
    } catch (_) {
      ip = 'unknown'
    }

    e.record.set('client_ip', ip)

    const honeypot = String(e.record.get('honeypot') || '').trim()
    const loadedAt = Number(e.record.get('loaded_at')) || 0
    const email = String(e.record.get('email') || '')
      .trim()
      .toLowerCase()
    const title = String(e.record.get('title') || '').trim()
    const description = String(e.record.get('description') || '').trim()
    const name = String(e.record.get('name') || '').trim()

    // Rate Limit check
    let isRateLimited = false
    const limitCount = 5
    const windowMs = 60 * 60 * 1000 // 1 hour
    const now = new Date()
    const rlKey = `embed_${ip}`

    if (ip !== 'unknown') {
      $app.runInTransaction((txApp) => {
        let bucket = null
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
          try {
            const col = txApp.findCollectionByNameOrId('rate_limit_buckets')
            bucket = new Record(col)
            bucket.set('key', rlKey)
            bucket.set('count', 1)
            bucket.set('window_start', now.toISOString())
            txApp.save(bucket)
          } catch (_) {}
        }
      })
    }

    if (isRateLimited) {
      e.record.set('error', 'rate_limit')
      e.record.set('processed', true)
      return e.next()
    }

    if (honeypot) {
      e.record.set('error', 'honeypot')
      e.record.set('processed', true)
      return e.next()
    }

    const elapsedMs = Date.now() - loadedAt
    if (!loadedAt || elapsedMs < 2000 || Math.abs(elapsedMs) > 3600000) {
      e.record.set('error', 'time_check')
      e.record.set('processed', true)
      return e.next()
    }

    let specificEmbedKey = null
    try {
      specificEmbedKey = $app.findFirstRecordByData('embed_keys', 'key', embedKeyStr)
    } catch (_) {}

    if (!specificEmbedKey || !specificEmbedKey.getBool('is_active')) {
      e.record.set('error', 'invalid_key')
      e.record.set('processed', true)
      return e.next()
    }

    if (!email || !title || !description) {
      e.record.set('error', 'missing_fields')
      e.record.set('processed', true)
      return e.next()
    }

    // Proceed to create user/ticket
    let user = null
    let userIsNew = false
    try {
      user = $app.findAuthRecordByEmail('users', email)
    } catch (_) {
      try {
        const usersCol = $app.findCollectionByNameOrId('users')
        user = new Record(usersCol)
        user.setEmail(email)
        user.setPassword($security.randomString(20))
        user.set('name', name)
        user.set('role', 'client')
        $app.save(user)
        userIsNew = true
      } catch (err) {
        $app.logger().error('failed_to_create_user', 'error', String(err))
        throw err
      }
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
          $os.getenv('EMBED_BASE_URL') ||
          $os.getenv('VITE_EMBED_BASE_URL') ||
          'http://localhost:5173'
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
        $app.logger().error('Failed to send welcome email', 'error', String(err))
      }
    }
  } catch (err) {
    $app.logger().error('hook_exception', 'error', String(err), 'stack', err.stack || '')
    e.record.set('error', 'hook_exception')
    e.record.set('processed', true)
  }

  return e.next()
}, 'embed_submissions')
