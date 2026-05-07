migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('comments')
    if (!col.fields.getByName('source')) {
      col.fields.add(
        new SelectField({
          name: 'source',
          values: ['app', 'email', 'api'],
          maxSelect: 1,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('comments')
    if (col.fields.getByName('source')) {
      col.fields.removeByName('source')
      app.save(col)
    }
  },
)
