migrate(
  (app) => {
    const collection = new Collection({
      name: 'embed_keys',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || @request.auth.role = 'agent'",
      viewRule: "@request.auth.role = 'admin' || @request.auth.role = 'agent'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
          autogeneratePattern: '[a-zA-Z0-9]{24}',
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'allowed_origins',
          type: 'json',
        },
        {
          name: 'default_category',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('categories').id,
          maxSelect: 1,
        },
        {
          name: 'default_team',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('teams').id,
          maxSelect: 1,
        },
        {
          name: 'is_active',
          type: 'bool',
        },
        {
          name: 'created_by',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_embed_keys_key ON embed_keys (key)'],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('embed_keys')
    app.delete(collection)
  },
)
