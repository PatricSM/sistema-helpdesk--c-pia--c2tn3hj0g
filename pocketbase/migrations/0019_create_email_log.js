migrate(
  (app) => {
    const collection = new Collection({
      name: 'email_log',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null,
      updateRule: null,
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'direction',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['in', 'out'],
        },
        { name: 'to', type: 'text' },
        { name: 'from', type: 'text' },
        { name: 'subject', type: 'text' },
        { name: 'body_text', type: 'text' },
        { name: 'body_html', type: 'text' },
        {
          name: 'ticket',
          type: 'relation',
          required: false,
          maxSelect: 1,
          cascadeDelete: false,
          collectionId: app.findCollectionByNameOrId('tickets').id,
        },
        { name: 'resend_id', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: false,
          maxSelect: 1,
          values: ['queued', 'sent', 'delivered', 'bounced', 'failed'],
        },
        { name: 'error', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_email_log_ticket ON email_log (ticket)'],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('email_log')
    app.delete(collection)
  },
)
