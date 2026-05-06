migrate(
  (app) => {
    const tickets = app.findCollectionByNameOrId('tickets')
    const notifications = new Collection({
      name: 'notifications',
      type: 'base',
      listRule: '@request.auth.id = recipient',
      viewRule: '@request.auth.id = recipient',
      createRule: "@request.auth.id != ''",
      updateRule: '@request.auth.id = recipient',
      deleteRule: '@request.auth.id = recipient',
      fields: [
        {
          name: 'recipient',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          name: 'kind',
          type: 'select',
          values: ['ticket_assigned', 'ticket_replied', 'ticket_status_changed', 'mention'],
          maxSelect: 1,
          required: true,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'text' },
        {
          name: 'ticket',
          type: 'relation',
          collectionId: tickets.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'read_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
      indexes: [
        'CREATE INDEX idx_notifications_recipient ON notifications (recipient)',
        'CREATE INDEX idx_notifications_read_at ON notifications (read_at)',
      ],
    })
    app.save(notifications)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('notifications'))
    } catch (_) {}
  },
)
