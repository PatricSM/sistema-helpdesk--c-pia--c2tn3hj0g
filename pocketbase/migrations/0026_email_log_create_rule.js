migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('email_log')
    col.createRule = ''
    col.updateRule = ''
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('email_log')
    col.createRule = null
    col.updateRule = null
    app.save(col)
  },
)
