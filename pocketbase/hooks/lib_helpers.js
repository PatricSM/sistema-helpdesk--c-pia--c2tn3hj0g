/// <reference path="../pb_data/types.d.ts" />

/**
 * Helpers compartilhados entre hooks.
 *
 * Como usar nos outros hooks:
 *   const helpers = require(`${__hooks}/lib_helpers.js`)
 */

/**
 * Cria uma notificação para o usuário recipient.
 * Silencioso em caso de falha (não impede o evento original).
 */
function createNotification(app, params) {
  try {
    const collection = app.findCollectionByNameOrId('notifications')
    const record = new Record(collection)
    record.set('recipient', params.recipient)
    record.set('kind', params.kind)
    record.set('title', params.title)
    if (params.body) record.set('body', params.body)
    if (params.ticket) record.set('ticket', params.ticket)
    app.save(record)
  } catch (err) {
    console.error('createNotification failed:', err)
  }
}

/**
 * Lê settings.{key,value} pelo key.
 */
function getSetting(app, key) {
  try {
    const rec = app.findFirstRecordByData('settings', 'key', key)
    return rec.get('value')
  } catch (_) {
    return null
  }
}

/**
 * Encontra a primeira regra de assignment ativa que bate nas
 * condições do ticket. Ordem por priority_order ASC.
 */
function findMatchingAssignmentRule(app, ticket) {
  try {
    const rules = app.findRecordsByFilter(
      'assignment_rules',
      `is_active = true`,
      'priority_order',
      100,
      0,
    )
    for (const rule of rules) {
      const condPriority = rule.get('condition_priority')
      const condCategory = rule.get('condition_category')
      if (condPriority && ticket.get('priority') !== condPriority) continue
      if (condCategory && ticket.get('category') !== condCategory) continue
      return rule
    }
  } catch (err) {
    console.error('findMatchingAssignmentRule failed:', err)
  }
  return null
}

/**
 * Encontra a SLA policy ativa para a prioridade do ticket.
 */
function findSlaPolicyForPriority(app, priority) {
  try {
    const items = app.findRecordsByFilter(
      'sla_policies',
      `is_active = true && priority = "${priority}"`,
      '',
      1,
      0,
    )
    return items[0] || null
  } catch (_) {
    return null
  }
}

/**
 * Soma minutos a uma data (string ISO ou Date) e retorna ISO string.
 */
function addMinutesIso(dateInput, minutes) {
  const d = dateInput ? new Date(dateInput) : new Date()
  d.setMinutes(d.getMinutes() + minutes)
  return d.toISOString()
}

/**
 * Round-robin de membros de um time: escolhe quem tem menos
 * chamados abertos atribuídos. Retorna user id ou null.
 */
function pickTeamMemberRoundRobin(app, teamId) {
  try {
    const members = app.findRecordsByFilter('team_members', `team = "${teamId}"`, '', 100, 0)
    if (members.length === 0) return null

    let bestUserId = null
    let bestCount = Infinity
    for (const m of members) {
      const userId = m.get('user')
      if (!userId) continue
      let count = 0
      try {
        const list = app.findRecordsByFilter(
          'tickets',
          `assignee = "${userId}" && (status = "open" || status = "in_progress")`,
          '',
          1000,
          0,
        )
        count = list.length
      } catch (_) {
        count = 0
      }
      if (count < bestCount) {
        bestCount = count
        bestUserId = userId
      }
    }
    return bestUserId
  } catch (err) {
    console.error('pickTeamMemberRoundRobin failed:', err)
    return null
  }
}

module.exports = {
  createNotification,
  getSetting,
  findMatchingAssignmentRule,
  findSlaPolicyForPriority,
  addMinutesIso,
  pickTeamMemberRoundRobin,
}
