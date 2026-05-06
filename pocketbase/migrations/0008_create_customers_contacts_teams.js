migrate(
  (app) => {
    // ===== Customers (organizações/empresas) =====
    const customers = new Collection({
      name: 'customers',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin' || @request.auth.role = 'agent'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'agent'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'website', type: 'url' },
        { name: 'industry', type: 'text' },
        { name: 'logo', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_customers_name ON customers (name)'],
    })
    app.save(customers)

    // ===== Contacts (pessoas vinculadas a customers) =====
    const contacts = new Collection({
      name: 'contacts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin' || @request.auth.role = 'agent'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'agent'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'mobile', type: 'text' },
        {
          name: 'customer',
          type: 'relation',
          collectionId: customers.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_contacts_customer ON contacts (customer)',
        'CREATE INDEX idx_contacts_email ON contacts (email)',
      ],
    })
    app.save(contacts)

    // ===== Teams =====
    const teams = new Collection({
      name: 'teams',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'color', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_teams_name ON teams (name)'],
    })
    app.save(teams)

    // ===== Team Members (associação team <-> user) =====
    const teamMembers = new Collection({
      name: 'team_members',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'team',
          type: 'relation',
          collectionId: teams.id,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          name: 'user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          name: 'role',
          type: 'select',
          values: ['member', 'lead'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_team_members_team_user ON team_members (team, user)',
        'CREATE INDEX idx_team_members_user ON team_members (user)',
      ],
    })
    app.save(teamMembers)
  },
  (app) => {
    for (const name of ['team_members', 'teams', 'contacts', 'customers']) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  },
)
