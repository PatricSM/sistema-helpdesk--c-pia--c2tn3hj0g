migrate(
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    tickets.fields.add(
      new SelectField({
        name: 'type',
        values: ['question', 'incident', 'bug', 'unspecified'],
        maxSelect: 1,
      }),
    )
    tickets.fields.add(
      new DateField({
        name: 'first_response_at',
      }),
    )
    tickets.fields.add(
      new DateField({
        name: 'resolution_at',
      }),
    )
    tickets.fields.add(
      new DateField({
        name: 'sla_response_due',
      }),
    )
    tickets.fields.add(
      new DateField({
        name: 'sla_resolution_due',
      }),
    )
    app.save(tickets)
  },
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    for (const f of [
      'type',
      'first_response_at',
      'resolution_at',
      'sla_response_due',
      'sla_resolution_due',
    ]) {
      try {
        tickets.fields.removeByName(f)
      } catch (_) {}
    }
    app.save(tickets)
  },
)
