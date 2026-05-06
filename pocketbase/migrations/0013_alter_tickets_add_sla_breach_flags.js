migrate(
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    tickets.fields.add(new BoolField({ name: 'sla_response_breached' }))
    tickets.fields.add(new BoolField({ name: 'sla_resolution_breached' }))
    app.save(tickets)
  },
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    for (const f of ['sla_response_breached', 'sla_resolution_breached']) {
      try {
        tickets.fields.removeByName(f)
      } catch (_) {}
    }
    app.save(tickets)
  },
)
