migrate(
  (app) => {
    const categories = app.findCollectionByNameOrId('categories')
    categories.fields.add(
      new TextField({
        name: 'color',
      }),
    )
    app.save(categories)
  },
  (app) => {
    const categories = app.findCollectionByNameOrId('categories')
    categories.fields.removeByName('color')
    app.save(categories)
  },
)
