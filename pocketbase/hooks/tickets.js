/// <reference path="../pb_data/types.d.ts" />

/**
 * Hooks da coleção tickets:
 * - onRecordCreate: aplica SLA policy (sla_response_due / sla_resolution_due)
 * - onRecordAfterCreateSuccess: aplica assignment rules + notifica assignee
 * - onRecordUpdate: detecta mudança de assignee/status para snapshots
 * - onRecordAfterUpdateSuccess: notifica assignee/requester sobre mudanças
 */

onRecordCreate((e) => {
  const helpers = require(`${__hooks}/lib_helpers.js`)
  const ticket = e.record

  const priority = ticket.get('priority')
  if (priority) {
    const policy = helpers.findSlaPolicyForPriority($app, priority)
    if (policy) {
      const responseMin = policy.get('response_time_min')
      const resolutionMin = policy.get('resolution_time_min')
      try {
        if (responseMin) {
          ticket.set('sla_response_due', helpers.addMinutesIso(null, responseMin))
        }
        if (resolutionMin) {
          ticket.set('sla_resolution_due', helpers.addMinutesIso(null, resolutionMin))
        }
      } catch (err) {
        console.error('[ticket sla] failed to set due dates:', err)
      }
    }
  }

  e.next()
}, 'tickets')

onRecordAfterCreateSuccess((e) => {
  const helpers = require(`${__hooks}/lib_helpers.js`)
  const ticket = e.record

  // Aplicar regra de assignment (se nenhum assignee já estiver definido)
  if (!ticket.get('assignee')) {
    const rule = helpers.findMatchingAssignmentRule($app, ticket)
    if (rule) {
      let userId = rule.get('assign_to_user')

      // Se a regra define um time, fazer round-robin entre membros
      if (!userId) {
        const teamId = rule.get('assign_to_team')
        if (teamId) {
          userId = helpers.pickTeamMemberRoundRobin($app, teamId)
          if (userId) {
            ticket.set('team', teamId)
          }
        }
      }

      if (userId) {
        try {
          ticket.set('assignee', userId)
          $app.save(ticket)
        } catch (err) {
          console.error('auto-assignment failed:', err)
        }
      }
    }
  }

  // Notificar assignee via in-app
  const assignee = ticket.get('assignee')
  if (assignee && assignee !== ticket.get('requester')) {
    helpers.createNotification($app, {
      recipient: assignee,
      kind: 'ticket_assigned',
      title: `Novo chamado atribuído: ${ticket.get('title')}`,
      body: ticket.get('description')?.slice(0, 200),
      ticket: ticket.id,
    })
  }

  // Notificações por Email
  try {
    const emailHelpers = require(`${__hooks}/lib_email.js`)
    const requesterId = ticket.get('requester')

    if (requesterId) {
      const requester = $app.findRecordById('users', requesterId)
      if (requester && requester.get('email')) {
        const { html, text } = emailHelpers.renderTicketCreated(ticket, requester)
        emailHelpers.sendEmail($app, {
          to: requester.get('email'),
          subject: `Chamado Criado: [${ticket.id}] ${ticket.get('title')}`,
          html,
          text,
          replyTo: emailHelpers.replyToFor(ticket.id),
          ticketId: ticket.id,
        })
      }
    }

    if (assignee && assignee !== requesterId) {
      const assigneeRecord = $app.findRecordById('users', assignee)
      if (assigneeRecord && assigneeRecord.get('email')) {
        const { html, text } = emailHelpers.renderTicketAssigned(ticket, assigneeRecord)
        emailHelpers.sendEmail($app, {
          to: assigneeRecord.get('email'),
          subject: `Novo Chamado Atribuído: [${ticket.id}] ${ticket.get('title')}`,
          html,
          text,
          replyTo: emailHelpers.replyToFor(ticket.id),
          ticketId: ticket.id,
        })
      }
    }
  } catch (err) {
    console.error('[ticket email notification error]', err)
  }

  e.next()
}, 'tickets')

onRecordUpdate((e) => {
  const ticket = e.record
  // Snapshot dos campos antigos via originalCopy() — disponível em onAfter
  // através de e.record.original() se necessário.
  e.next()
}, 'tickets')

onRecordAfterUpdateSuccess((e) => {
  const helpers = require(`${__hooks}/lib_helpers.js`)
  const ticket = e.record
  const original = ticket.original()
  if (!original) {
    e.next()
    return
  }

  const oldAssignee = original.get('assignee')
  const newAssignee = ticket.get('assignee')
  const oldStatus = original.get('status')
  const newStatus = ticket.get('status')
  const requester = ticket.get('requester')

  // Notificar novo assignee se mudou
  if (newAssignee && newAssignee !== oldAssignee) {
    helpers.createNotification($app, {
      recipient: newAssignee,
      kind: 'ticket_assigned',
      title: `Chamado atribuído a você: ${ticket.get('title')}`,
      body: ticket.get('description')?.slice(0, 200),
      ticket: ticket.id,
    })
  }

  // Notificar requester sobre mudança de status (exceto se ele mesmo mudou)
  const auth = e.auth
  if (newStatus !== oldStatus && requester && (!auth || auth.id !== requester)) {
    const statusLabel = {
      open: 'Aberto',
      in_progress: 'Em andamento',
      resolved: 'Resolvido',
      closed: 'Fechado',
    }
    helpers.createNotification($app, {
      recipient: requester,
      kind: 'ticket_status_changed',
      title: `Chamado atualizado: ${ticket.get('title')}`,
      body: `Status alterado para "${statusLabel[newStatus] || newStatus}".`,
      ticket: ticket.id,
    })
  }

  // Quando muda para resolved, marcar resolution_at
  // (PB date fields retornam objeto truthy mesmo vazio; checamos via String())
  if (newStatus === 'resolved' && oldStatus !== 'resolved') {
    const cur = String(ticket.get('resolution_at') || '').trim()
    if (!cur) {
      try {
        ticket.set('resolution_at', new Date().toISOString())
        $app.save(ticket)
      } catch (err) {
        console.error('failed to set resolution_at:', err)
      }
    }
  }

  e.next()
}, 'tickets')

onRecordCreate((e) => {
  // Versão instrumentada: cada step grava log + se quebrar, error
  // recebe nome específico (ex.: "fail:create_user") em vez do
  // genérico "hook_exception". Permite localizar a linha que falha.
  let lastStep = 'init'
  const step = (name) => {
    lastStep = name
    try {
      $app.logger().info('embed_step', 'step', name, 'recordId', String(e.record.id || 'new'))
    } catch (_) {}
  }

  try {
    step('1:read_inputs')
    const embedKeyStr = String(e.record.get('embed_key') || '').trim()
    const honeypot = String(e.record.get('honeypot') || '').trim()
    const loadedAt = Number(e.record.get('loaded_at')) || 0
    const email = String(e.record.get('email') || '')
      .trim()
      .toLowerCase()
    const title = String(e.record.get('title') || '').trim()
    const description = String(e.record.get('description') || '').trim()
    const name = String(e.record.get('name') || '').trim()

    step('2:get_ip')
    let ip = 'unknown'
    try {
      ip = String(e.request.remoteAddr || '')
      if (!ip || ip === 'undefined') ip = 'unknown'
    } catch (_) {
      ip = 'unknown'
    }
    e.record.set('client_ip', ip)

    step('3:rate_limit_check')
    let isRateLimited = false
    const limitCount = 5
    const windowMs = 60 * 60 * 1000
    const now = new Date()
    const rlKey = `embed_${ip}`
    if (ip !== 'unknown') {
      try {
        $app.runInTransaction((txApp) => {
          let bucket = null
          try {
            bucket = txApp.findFirstRecordByData('rate_limit_buckets', 'key', rlKey)
          } catch (_) {}
          if (bucket) {
            const wsRaw = bucket.get('window_start')
            const ws = new Date(wsRaw || 0)
            if (now.getTime() - ws.getTime() > windowMs) {
              bucket.set('count', 1)
              bucket.set('window_start', now.toISOString())
            } else {
              const count = Number(bucket.get('count') || 0) + 1
              if (count > limitCount) isRateLimited = true
              else bucket.set('count', count)
            }
            if (!isRateLimited) txApp.save(bucket)
          } else {
            try {
              const col = txApp.findCollectionByNameOrId('rate_limit_buckets')
              bucket = new Record(col)
              bucket.set('key', rlKey)
              bucket.set('count', 1)
              bucket.set('window_start', now.toISOString())
              txApp.save(bucket)
            } catch (errInner) {
              $app.logger().warn('rate_limit_bucket_create_failed', 'error', String(errInner))
            }
          }
        })
      } catch (errTx) {
        // Transaction falhou — log mas não estourar (rate limit é defesa secundária)
        $app.logger().warn('rate_limit_tx_failed', 'error', String(errTx))
      }
    }

    step('4:check_rate_limit_result')
    if (isRateLimited) {
      e.record.set('error', 'rate_limit')
      e.record.set('processed', true)
      return e.next()
    }

    step('5:check_honeypot')
    if (honeypot) {
      e.record.set('error', 'honeypot')
      e.record.set('processed', true)
      return e.next()
    }

    step('6:check_time')
    const elapsedMs = Date.now() - loadedAt
    if (!loadedAt || elapsedMs < 2000 || Math.abs(elapsedMs) > 3600000) {
      e.record.set('error', 'time_check')
      e.record.set('processed', true)
      return e.next()
    }

    step('7:lookup_embed_key')
    let specificEmbedKey = null
    try {
      specificEmbedKey = $app.findFirstRecordByData('embed_keys', 'key', embedKeyStr)
    } catch (errKey) {
      $app.logger().warn('embed_key_lookup_failed', 'error', String(errKey))
    }

    step('8:validate_embed_key')
    let isActive = false
    if (specificEmbedKey) {
      try {
        isActive = Boolean(specificEmbedKey.get('is_active'))
      } catch (_) {
        isActive = false
      }
    }
    if (!specificEmbedKey || !isActive) {
      e.record.set('error', 'invalid_key')
      e.record.set('processed', true)
      return e.next()
    }

    step('9:validate_required_fields')
    if (!email || !title || !description) {
      e.record.set('error', 'missing_fields')
      e.record.set('processed', true)
      return e.next()
    }

    step('10:find_user')
    let user = null
    let userIsNew = false
    try {
      user = $app.findAuthRecordByEmail('users', email)
    } catch (_) {
      // Não existe — vamos criar
    }

    if (!user) {
      step('11:create_user')
      try {
        const usersCol = $app.findCollectionByNameOrId('users')
        user = new Record(usersCol)
        user.setEmail(email)
        // Senha aleatória com complexidade garantida
        const rand =
          typeof $security !== 'undefined' && $security.randomString
            ? $security.randomString(16)
            : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
        user.setPassword(rand + 'Aa1@')
        user.set('name', name || email.split('@')[0])
        user.set('role', 'client')
        step('11.1:save_user')
        $app.save(user)
        userIsNew = true
      } catch (errUser) {
        $app
          .logger()
          .error(
            'fail:create_user',
            'error',
            String(errUser),
            'stack',
            String(errUser && errUser.stack ? errUser.stack : ''),
          )
        e.record.set('error', 'fail:create_user:' + String(errUser).slice(0, 80))
        e.record.set('processed', true)
        return e.next()
      }
    }

    step('12:find_tickets_collection')
    let ticketsCol = null
    try {
      ticketsCol = $app.findCollectionByNameOrId('tickets')
    } catch (errCol) {
      $app.logger().error('fail:find_tickets_col', 'error', String(errCol))
      e.record.set('error', 'fail:find_tickets_col')
      e.record.set('processed', true)
      return e.next()
    }

    step('13:create_ticket')
    const ticket = new Record(ticketsCol)
    ticket.set('title', title)
    ticket.set('description', description)
    ticket.set('status', 'open')
    ticket.set('priority', 'medium')
    const defCategory = specificEmbedKey.get('default_category')
    if (defCategory) ticket.set('category', defCategory)
    const defTeam = specificEmbedKey.get('default_team')
    if (defTeam) ticket.set('team', defTeam)
    ticket.set('requester', user.id)
    ticket.set('source', 'embed')
    ticket.set('embed_key', specificEmbedKey.id)

    step('14:save_ticket')
    try {
      $app.save(ticket)
    } catch (errTicket) {
      $app
        .logger()
        .error(
          'fail:save_ticket',
          'error',
          String(errTicket),
          'stack',
          String(errTicket && errTicket.stack ? errTicket.stack : ''),
        )
      e.record.set('error', 'fail:save_ticket:' + String(errTicket).slice(0, 80))
      e.record.set('processed', true)
      return e.next()
    }

    step('15:set_success_fields')
    e.record.set('ticket', ticket.id)
    e.record.set('processed', true)
    e.record.set('error', '')

    step('16:welcome_email')
    if (userIsNew) {
      try {
        const baseUrl =
          $os.getenv('EMBED_BASE_URL') ||
          $os.getenv('VITE_EMBED_BASE_URL') ||
          'http://localhost:5173'
        const resetUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}`
        const emailHelper = require(`${__hooks}/lib_email.js`)
        const { html, text } = emailHelper.renderWelcome(user, resetUrl)
        emailHelper.sendEmail($app, {
          to: email,
          subject: 'Bem-vindo ao Suporte',
          html,
          text,
        })
      } catch (errMail) {
        $app.logger().warn('welcome_email_failed', 'error', String(errMail))
      }
    }

    step('17:done')
  } catch (err) {
    $app
      .logger()
      .error(
        'hook_exception_at',
        'lastStep',
        lastStep,
        'error',
        String(err),
        'stack',
        String(err && err.stack ? err.stack : ''),
      )
    try {
      e.record.set('error', 'hook_exception:' + lastStep + ':' + String(err).slice(0, 80))
      e.record.set('processed', true)
    } catch (_) {}
  }

  return e.next()
}, 'embed_submissions')
