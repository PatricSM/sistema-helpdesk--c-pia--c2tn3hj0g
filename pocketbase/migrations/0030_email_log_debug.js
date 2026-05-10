migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('email_log')
    if (!col.fields.getByName('debug_info')) {
      col.fields.add(new TextField({ name: 'debug_info' }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('email_log')
    const field = col.fields.getByName('debug_info')
    if (field) {
      col.fields.removeById(field.id)
      app.save(col)
    }
  },
)
