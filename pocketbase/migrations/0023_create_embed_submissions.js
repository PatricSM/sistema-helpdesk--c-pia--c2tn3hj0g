migrate(
  (app) => {
    const collection = new Collection({
      name: 'embed_submissions',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: null,
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'embed_key', type: 'text', required: true },
        { name: 'name', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'title', type: 'text' },
        { name: 'description', type: 'text' },
        { name: 'honeypot', type: 'text' },
        { name: 'loaded_at', type: 'number' },
        { name: 'lgpd', type: 'bool' },
        { name: 'processed', type: 'bool' },
        {
          name: 'ticket',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('tickets').id,
          maxSelect: 1,
        },
        { name: 'error', type: 'text' },
        { name: 'client_ip', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_embed_subs_created ON embed_submissions (created)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('embed_submissions')
    app.delete(collection)
  },
)
