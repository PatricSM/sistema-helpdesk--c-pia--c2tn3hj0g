migrate(
  (app) => {
    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'patric.martins@adapta.org')
    } catch (_) {
      return
    }

    const cannedCol = app.findCollectionByNameOrId('canned_responses')
    const seed = [
      {
        title: 'Saudação inicial',
        shortcut: '/oi',
        body: 'Olá! Obrigado por entrar em contato. Já estou analisando seu chamado.',
      },
      {
        title: 'Pedido de mais detalhes',
        shortcut: '/detalhes',
        body: 'Você pode me enviar um print da tela e os passos que você seguiu até o problema?',
      },
      {
        title: 'Encerramento',
        shortcut: '/encerrar',
        body: 'Estou marcando este chamado como resolvido. Caso precise, é só responder por aqui que reabrimos.',
      },
    ]

    for (const item of seed) {
      try {
        app.findFirstRecordByFilter(
          'canned_responses',
          `owner = '${admin.id}' && title = '${item.title.replace(/'/g, "''")}'`,
        )
      } catch (_) {
        const r = new Record(cannedCol)
        r.set('title', item.title)
        r.set('body', item.body)
        r.set('shortcut', item.shortcut)
        r.set('owner', admin.id)
        app.save(r)
      }
    }
  },
  (app) => {
    try {
      const items = app.findRecordsByFilter('canned_responses', '', '', 1000, 0)
      for (const r of items) app.delete(r)
    } catch (_) {}
  },
)
