migrate(
  (app) => {
    const listViews = new Collection({
      name: 'list_views',
      type: 'base',
      // Visões: usuário vê as suas + as públicas
      listRule: "@request.auth.id != '' && (owner = @request.auth.id || is_public = true)",
      viewRule: "@request.auth.id != '' && (owner = @request.auth.id || is_public = true)",
      createRule: "@request.auth.id != '' && owner = @request.auth.id",
      updateRule: "@request.auth.id != '' && owner = @request.auth.id",
      deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'collection_name', type: 'text', required: true },
        { name: 'filters', type: 'json' },
        { name: 'sort_key', type: 'text' },
        { name: 'sort_dir', type: 'select', values: ['asc', 'desc'], maxSelect: 1 },
        { name: 'columns_hidden', type: 'json' },
        {
          name: 'owner',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        { name: 'is_public', type: 'bool' },
        { name: 'is_default', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_list_views_owner_collection ON list_views (owner, collection_name)',
        'CREATE INDEX idx_list_views_public ON list_views (is_public)',
      ],
    })
    app.save(listViews)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('list_views'))
    } catch (_) {}
  },
)
