migrate(
  (app) => {
    const resendEvents = new Collection({
      name: 'resend_webhook_events',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'event_type', type: 'text', required: false },
        { name: 'email_id', type: 'text', required: false },
        { name: 'to_email', type: 'text', required: false },
        { name: 'payload', type: 'json', required: false, maxSize: 2000000 },
        { name: 'svix_id', type: 'text', required: false },
        { name: 'svix_timestamp', type: 'text', required: false },
        { name: 'svix_signature', type: 'text', required: false },
        { name: 'processed', type: 'bool', required: false },
        { name: 'error', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_resend_events_email_id ON resend_webhook_events (email_id)',
        'CREATE INDEX idx_resend_events_type ON resend_webhook_events (event_type)',
      ],
    })
    app.save(resendEvents)

    const inboundEvents = new Collection({
      name: 'inbound_email_events',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'message_id', type: 'text', required: false },
        { name: 'from_email', type: 'text', required: false },
        { name: 'to_email', type: 'text', required: false },
        { name: 'subject', type: 'text', required: false },
        { name: 'text_body', type: 'text', required: false },
        { name: 'html_body', type: 'text', required: false },
        { name: 'in_reply_to', type: 'text', required: false },
        { name: 'payload', type: 'json', required: false, maxSize: 4000000 },
        { name: 'svix_id', type: 'text', required: false },
        { name: 'svix_timestamp', type: 'text', required: false },
        { name: 'svix_signature', type: 'text', required: false },
        {
          name: 'matched_ticket',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('tickets').id,
          maxSelect: 1,
        },
        { name: 'processed', type: 'bool', required: false },
        { name: 'error', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_inbound_email_message_id ON inbound_email_events (message_id)',
        'CREATE INDEX idx_inbound_email_in_reply_to ON inbound_email_events (in_reply_to)',
      ],
    })
    app.save(inboundEvents)
  },
  (app) => {
    try {
      const col1 = app.findCollectionByNameOrId('resend_webhook_events')
      app.delete(col1)
    } catch (_) {}

    try {
      const col2 = app.findCollectionByNameOrId('inbound_email_events')
      app.delete(col2)
    } catch (_) {}
  },
)
