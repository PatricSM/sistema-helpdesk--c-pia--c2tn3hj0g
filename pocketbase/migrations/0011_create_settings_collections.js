migrate(
  (app) => {
    // settings: key-value para configurações gerais (apenas admin)
    const settings = new Collection({
      name: 'settings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'value', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_settings_key ON settings (key)'],
    })
    app.save(settings)

    // email_accounts: contas de email do helpdesk para enviar/receber
    const emailAccounts = new Collection({
      name: 'email_accounts',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        {
          name: 'provider',
          type: 'select',
          values: ['gmail', 'outlook', 'sendgrid', 'smtp', 'imap'],
          maxSelect: 1,
        },
        { name: 'smtp_host', type: 'text' },
        { name: 'smtp_port', type: 'number' },
        { name: 'use_tls', type: 'bool' },
        { name: 'is_default', type: 'bool' },
        { name: 'is_active', type: 'bool' },
        { name: 'enable_outgoing', type: 'bool' },
        { name: 'enable_incoming', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_email_accounts_email ON email_accounts (email)'],
    })
    app.save(emailAccounts)

    // sla_policies: SLA por prioridade (response/resolution time em minutos)
    const slaPolicies = new Collection({
      name: 'sla_policies',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'priority', type: 'select', values: ['low', 'medium', 'high', 'urgent'] },
        { name: 'response_time_min', type: 'number' },
        { name: 'resolution_time_min', type: 'number' },
        { name: 'business_hours_only', type: 'bool' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_sla_policies_name ON sla_policies (name)'],
    })
    app.save(slaPolicies)

    // assignment_rules: regras de auto-atribuição
    const teams = app.findCollectionByNameOrId('teams')
    const categories = app.findCollectionByNameOrId('categories')
    const assignmentRules = new Collection({
      name: 'assignment_rules',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        {
          name: 'condition_priority',
          type: 'select',
          values: ['low', 'medium', 'high', 'urgent'],
        },
        {
          name: 'condition_category',
          type: 'relation',
          collectionId: categories.id,
          maxSelect: 1,
        },
        {
          name: 'assign_to_team',
          type: 'relation',
          collectionId: teams.id,
          maxSelect: 1,
        },
        {
          name: 'assign_to_user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'priority_order', type: 'number' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_assignment_rules_priority ON assignment_rules (priority_order)'],
    })
    app.save(assignmentRules)
  },
  (app) => {
    for (const name of ['assignment_rules', 'sla_policies', 'email_accounts', 'settings']) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  },
)
