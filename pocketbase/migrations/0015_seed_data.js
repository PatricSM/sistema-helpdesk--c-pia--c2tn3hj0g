migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    let adminId
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'patric.martins@adapta.org')
      adminId = admin.id
    } catch (_) {
      const record = new Record(users)
      record.setEmail('patric.martins@adapta.org')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Administrador')
      record.set('role', 'admin')
      app.save(record)
      adminId = record.id
    }

    const categories = app.findCollectionByNameOrId('categories')
    let catSup
    try {
      catSup = app.findFirstRecordByData('categories', 'name', 'Suporte Técnico')
    } catch (_) {
      const r1 = new Record(categories)
      r1.set('name', 'Suporte Técnico')
      r1.set('description', 'Problemas com equipamentos e sistemas')
      app.save(r1)
      catSup = r1

      const r2 = new Record(categories)
      r2.set('name', 'Financeiro')
      app.save(r2)

      const r3 = new Record(categories)
      r3.set('name', 'Recursos Humanos')
      app.save(r3)
    }

    const tickets = app.findCollectionByNameOrId('tickets')
    try {
      app.findFirstRecordByData('tickets', 'title', 'Problema de acesso ao e-mail')
    } catch (_) {
      const t1 = new Record(tickets)
      t1.set('title', 'Problema de acesso ao e-mail')
      t1.set('description', 'Não consigo acessar minha conta de e-mail corporativa desde ontem.')
      t1.set('status', 'open')
      t1.set('priority', 'high')
      t1.set('category', catSup.id)
      t1.set('requester', adminId)
      app.save(t1)

      const kb = app.findCollectionByNameOrId('knowledge_base')
      const k1 = new Record(kb)
      k1.set('title', 'Como redefinir a senha do e-mail')
      k1.set(
        'content',
        'Para redefinir sua senha, acesse o portal de autoatendimento e clique em "Esqueci minha senha". Siga os passos enviados para o seu e-mail secundário.',
      )
      k1.set('category', catSup.id)
      k1.set('author', adminId)
      app.save(k1)
    }
  },
  (app) => {},
)
