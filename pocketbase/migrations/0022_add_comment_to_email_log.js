migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('email_log')
    const commentsCol = app.findCollectionByNameOrId('comments')

    if (!col.fields.getByName('comment')) {
      col.fields.add(
        new RelationField({
          name: 'comment',
          collectionId: commentsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('email_log')
    col.fields.removeByName('comment')
    app.save(col)
  },
)
