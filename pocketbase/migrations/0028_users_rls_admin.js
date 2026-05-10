migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.listRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'agent'"
    users.viewRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'agent'"
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    app.save(users)
  },
)
