/// <reference path="../pb_data/types.d.ts" />

/**
 * Cron a cada 15 minutos: detecta tickets com SLA estourado
 * (response ou resolution) e:
 *   1) marca a flag correspondente para não notificar repetido
 *   2) cria notification para assignee (ou requester se não houver)
 *
 * Roda em intervalos de 15 minutos via cron a cada quarto de hora.
 */

cronAdd('slaBreachCheck', '*/15 * * * *', () => {
  const helpers = require(`${__hooks}/_helpers.js`)
  const nowIso = new Date().toISOString()

  let responseBreaches = 0
  let resolutionBreaches = 0

  // ===== Response breach =====
  try {
    const items = $app.findRecordsByFilter(
      'tickets',
      `sla_response_breached = false && first_response_at = null && sla_response_due != null && sla_response_due < "${nowIso}" && status != "closed"`,
      '',
      200,
      0,
    )
    for (const t of items) {
      try {
        t.set('sla_response_breached', true)
        $app.save(t)
        const recipient = t.get('assignee') || t.get('requester')
        if (recipient) {
          helpers.createNotification($app, {
            recipient,
            kind: 'ticket_status_changed',
            title: `SLA de resposta estourado: ${t.get('title')}`,
            body: 'O tempo de primeira resposta foi excedido sem resposta do agente.',
            ticket: t.id,
          })
        }
        responseBreaches++
      } catch (err) {
        console.error('sla response breach save failed for', t.id, err)
      }
    }
  } catch (err) {
    console.error('slaBreachCheck (response) failed:', err)
  }

  // ===== Resolution breach =====
  try {
    const items = $app.findRecordsByFilter(
      'tickets',
      `sla_resolution_breached = false && resolution_at = null && sla_resolution_due != null && sla_resolution_due < "${nowIso}" && status != "closed" && status != "resolved"`,
      '',
      200,
      0,
    )
    for (const t of items) {
      try {
        t.set('sla_resolution_breached', true)
        $app.save(t)
        const recipient = t.get('assignee') || t.get('requester')
        if (recipient) {
          helpers.createNotification($app, {
            recipient,
            kind: 'ticket_status_changed',
            title: `SLA de resolução estourado: ${t.get('title')}`,
            body: 'O tempo total de resolução foi excedido.',
            ticket: t.id,
          })
        }
        resolutionBreaches++
      } catch (err) {
        console.error('sla resolution breach save failed for', t.id, err)
      }
    }
  } catch (err) {
    console.error('slaBreachCheck (resolution) failed:', err)
  }

  if (responseBreaches > 0 || resolutionBreaches > 0) {
    console.log(`slaBreachCheck: response=${responseBreaches} resolution=${resolutionBreaches}`)
  }
})
