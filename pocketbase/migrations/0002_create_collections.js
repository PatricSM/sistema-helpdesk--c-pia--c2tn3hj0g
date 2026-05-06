migrate(
  (app) => {
    const categories = new Collection({
      name: 'categories',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(categories)

    const tickets = new Collection({
      name: 'tickets',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (requester = @request.auth.id || @request.auth.role = 'agent' || @request.auth.role = 'admin')",
      viewRule:
        "@request.auth.id != '' && (requester = @request.auth.id || @request.auth.role = 'agent' || @request.auth.role = 'admin')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'agent' || @request.auth.role = 'admin' || requester = @request.auth.id)",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['open', 'in_progress', 'resolved', 'closed'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'priority',
          type: 'select',
          values: ['low', 'medium', 'high', 'urgent'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'category',
          type: 'relation',
          collectionId: categories.id,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'requester',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          required: true,
        },
        { name: 'assignee', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(tickets)

    const comments = new Collection({
      name: 'comments',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (ticket.requester = @request.auth.id && is_internal = false || @request.auth.role = 'agent' || @request.auth.role = 'admin')",
      viewRule:
        "@request.auth.id != '' && (ticket.requester = @request.auth.id && is_internal = false || @request.auth.role = 'agent' || @request.auth.role = 'admin')",
      createRule: "@request.auth.id != ''",
      updateRule: 'author = @request.auth.id',
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'ticket',
          type: 'relation',
          collectionId: tickets.id,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          name: 'author',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          required: true,
        },
        { name: 'body', type: 'text', required: true },
        { name: 'is_internal', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(comments)

    const knowledge_base = new Collection({
      name: 'knowledge_base',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin' || @request.auth.role = 'agent'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'agent'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text', required: true },
        { name: 'category', type: 'relation', collectionId: categories.id, maxSelect: 1 },
        { name: 'author', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(knowledge_base)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('knowledge_base'))
    app.delete(app.findCollectionByNameOrId('comments'))
    app.delete(app.findCollectionByNameOrId('tickets'))
    app.delete(app.findCollectionByNameOrId('categories'))
  },
)
