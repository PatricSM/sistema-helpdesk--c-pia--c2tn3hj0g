/// <reference path="../pb_data/types.d.ts" />

/**
 * Hooks da coleção comments:
 * - onRecordAfterCreateSuccess: marca first_response_at no ticket (se for de
 *   agente/admin, comentário público) + notifica requester (se público) ou
 *   demais agentes (se interno).
 */

onRecordAfterCreateSuccess((e) => {
  const helpers = require(`${__hooks}/_helpers.js`)
  const comment = e.record
  const ticketId = comment.get('ticket')
  const authorId = comment.get('author')
  const isInternal = comment.get('is_internal')
  if (!ticketId) {
    e.next()
    return
  }

  let ticket
  try {
    ticket = $app.findRecordById('tickets', ticketId)
  } catch (err) {
    console.error('comment hook: ticket not found:', err)
    e.next()
    return
  }

  // Lookup do autor para saber o role
  let authorRole = 'client'
  let authorName = 'Alguém'
  try {
    const author = $app.findRecordById('_pb_users_auth_', authorId)
    authorRole = author.get('role') || 'client'
    authorName = author.get('name') || author.get('email') || 'Alguém'
  } catch (_) {}

  const isStaff = authorRole === 'admin' || authorRole === 'agent'

  // 1) Marcar first_response_at se este é o primeiro comentário público
  //    de staff e o ticket ainda não foi respondido.
  // (PB retorna objeto truthy para date vazio — checamos via String().trim())
  const curFirstResp = String(ticket.get('first_response_at') || '').trim()
  if (isStaff && !isInternal && !curFirstResp) {
    try {
      ticket.set('first_response_at', new Date().toISOString())
      $app.save(ticket)
    } catch (err) {
      console.error('failed to set first_response_at:', err)
    }
  }

  // 2) Notificações
  const requester = ticket.get('requester')
  const assignee = ticket.get('assignee')

  if (!isInternal) {
    // Comentário público: notificar requester (se não foi o próprio que escreveu)
    if (requester && requester !== authorId) {
      helpers.createNotification($app, {
        recipient: requester,
        kind: 'ticket_replied',
        title: `Nova resposta em: ${ticket.get('title')}`,
        body: `${authorName}: ${(comment.get('body') || '').slice(0, 200)}`,
        ticket: ticketId,
      })
    }
    // E notificar assignee se for diferente do autor e do requester
    if (assignee && assignee !== authorId && assignee !== requester) {
      helpers.createNotification($app, {
        recipient: assignee,
        kind: 'ticket_replied',
        title: `Nova resposta em: ${ticket.get('title')}`,
        body: `${authorName}: ${(comment.get('body') || '').slice(0, 200)}`,
        ticket: ticketId,
      })
    }
  } else {
    // Comentário interno: notificar somente o assignee (não o cliente)
    if (assignee && assignee !== authorId) {
      helpers.createNotification($app, {
        recipient: assignee,
        kind: 'mention',
        title: `Nota interna em: ${ticket.get('title')}`,
        body: `${authorName}: ${(comment.get('body') || '').slice(0, 200)}`,
        ticket: ticketId,
      })
    }
  }

  e.next()
}, 'comments')
