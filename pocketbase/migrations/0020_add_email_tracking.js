migrate(
  (app) => {
    // 1. Update users collection
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(
      new SelectField({
        name: 'email_status',
        values: ['ok', 'bounced', 'complained'],
        maxSelect: 1,
      }),
    )
    users.fields.add(new DateField({ name: 'last_bounce_at' }))
    app.save(users)

    // 2. Update comments collection
    const comments = app.findCollectionByNameOrId('comments')
    comments.fields.add(new TextField({ name: 'message_id' }))
    comments.fields.add(new TextField({ name: 'in_reply_to' }))
    app.save(comments)

    // 3. Create rate_limit_buckets collection
    const buckets = new Collection({
      name: 'rate_limit_buckets',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'count', type: 'number', required: true },
        { name: 'window_start', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_rate_limit_buckets_key ON rate_limit_buckets (key)'],
    })
    app.save(buckets)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('email_status')
    users.fields.removeByName('last_bounce_at')
    app.save(users)

    const comments = app.findCollectionByNameOrId('comments')
    comments.fields.removeByName('message_id')
    comments.fields.removeByName('in_reply_to')
    app.save(comments)

    const buckets = app.findCollectionByNameOrId('rate_limit_buckets')
    app.delete(buckets)
  },
)
