migrate(
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    const customers = app.findCollectionByNameOrId('customers')
    const teams = app.findCollectionByNameOrId('teams')
    tickets.fields.add(
      new RelationField({
        name: 'customer',
        collectionId: customers.id,
        maxSelect: 1,
      }),
    )
    tickets.fields.add(
      new RelationField({
        name: 'team',
        collectionId: teams.id,
        maxSelect: 1,
      }),
    )
    app.save(tickets)
  },
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    for (const f of ['customer', 'team']) {
      try {
        tickets.fields.removeByName(f)
      } catch (_) {}
    }
    app.save(tickets)
  },
)
