/// <reference path="../pb_data/types.d.ts" />

/**
 * Hooks da coleção tickets:
 * - onRecordCreate: aplica SLA policy (sla_response_due / sla_resolution_due)
 * - onRecordAfterCreateSuccess: aplica assignment rules + notifica assignee
 * - onRecordUpdate: detecta mudança de assignee/status para snapshots
 * - onRecordAfterUpdateSuccess: notifica assignee/requester sobre mudanças
 */

onRecordCreate((e) => {
  const helpers = require(`${__hooks}/_helpers.js`)
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
  const helpers = require(`${__hooks}/_helpers.js`)
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
    const emailHelpers = require(`${__hooks}/_email.js`)
    const requesterId = ticket.get('requester')

    if (requesterId) {
      const requester = $app.findRecordById('_pb_users_auth_', requesterId)
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
      const assigneeRecord = $app.findRecordById('_pb_users_auth_', assignee)
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
  const helpers = require(`${__hooks}/_helpers.js`)
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
