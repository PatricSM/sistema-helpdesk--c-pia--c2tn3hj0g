migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tickets')

    if (!col.fields.getByName('source')) {
      col.fields.add(
        new SelectField({
          name: 'source',
          maxSelect: 1,
          values: ['web', 'embed', 'email', 'api'],
        }),
      )
    }

    if (!col.fields.getByName('embed_key')) {
      col.fields.add(
        new RelationField({
          name: 'embed_key',
          maxSelect: 1,
          collectionId: app.findCollectionByNameOrId('embed_keys').id,
        }),
      )
    }

    app.save(col)

    // Set default source to 'web' for existing tickets
    app
      .db()
      .newQuery("UPDATE tickets SET source = 'web' WHERE source IS NULL OR source = ''")
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tickets')

    if (col.fields.getByName('source')) {
      col.fields.removeByName('source')
    }

    if (col.fields.getByName('embed_key')) {
      col.fields.removeByName('embed_key')
    }

    app.save(col)
  },
)
