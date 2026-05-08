migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('embed_submissions')
    collection.viewRule = ''
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('embed_submissions')
    collection.viewRule = "@request.auth.role = 'admin'"
    app.save(collection)
  },
)
