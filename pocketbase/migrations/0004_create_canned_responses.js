migrate(
  (app) => {
    const collection = new Collection({
      name: 'canned_responses',
      type: 'base',
      // Respostas prontas: cada agente/admin gerencia as suas (campo owner)
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'agent')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'agent')",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'agent') && owner = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || owner = @request.auth.id)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || owner = @request.auth.id)",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'text', required: true },
        { name: 'shortcut', type: 'text' },
        {
          name: 'owner',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_canned_responses_owner ON canned_responses (owner)',
        'CREATE UNIQUE INDEX idx_canned_responses_owner_title ON canned_responses (owner, title)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('canned_responses'))
    } catch (_) {}
  },
)
