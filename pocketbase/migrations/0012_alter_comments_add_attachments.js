migrate(
  (app) => {
    const comments = app.findCollectionByNameOrId('comments')
    comments.fields.add(
      new FileField({
        name: 'attachments',
        maxSelect: 5,
        maxSize: 10485760, // 10MB
      }),
    )
    app.save(comments)
  },
  (app) => {
    const comments = app.findCollectionByNameOrId('comments')
    try {
      comments.fields.removeByName('attachments')
    } catch (_) {}
    app.save(comments)
  },
)
