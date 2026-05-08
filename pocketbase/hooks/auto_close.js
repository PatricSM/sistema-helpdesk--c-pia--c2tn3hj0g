/// <reference path="../pb_data/types.d.ts" />

/**
 * Cron job: fecha automaticamente chamados resolvidos há mais de N dias
 * (N vem de settings['general'].auto_close_resolved_after_days, padrão 7).
 *
 * Roda diariamente às 03:00 UTC. Para alterar a frequência, mexa no
 * cronAdd abaixo (formato cron Go: "min hour dayOfMonth month dayOfWeek").
 */

cronAdd('autoCloseResolvedTickets', '0 3 * * *', () => {
  let helpers = {}
  try {
    helpers = require('./lib_helpers.js')
  } catch (_) {}
  if (!helpers || !helpers.getSetting) {
    try {
      helpers = require(__hooks + '/lib_helpers.js')
    } catch (_) {}
  }
  if (!helpers || !helpers.getSetting) return

  const general = helpers.getSetting($app, 'general') || {}
  const days = parseInt(general.auto_close_resolved_after_days || 7, 10)
  if (days <= 0) {
    return
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffIso = cutoff.toISOString()

  let closed = 0
  try {
    const items = $app.findRecordsByFilter(
      'tickets',
      `status = "resolved" && resolution_at != null && resolution_at < "${cutoffIso}"`,
      '',
      500,
      0,
    )
    for (const t of items) {
      try {
        t.set('status', 'closed')
        $app.save(t)
        closed++
      } catch (err) {
        console.error('auto-close save failed for', t.id, err)
      }
    }
  } catch (err) {
    console.error('autoCloseResolvedTickets failed:', err)
  }

  console.log(`autoCloseResolvedTickets: closed ${closed} ticket(s) older than ${days}d`)
})
