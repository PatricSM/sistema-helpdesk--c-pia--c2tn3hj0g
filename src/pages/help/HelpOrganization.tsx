import { HelpLayout } from './HelpLayout'

export function HelpOrganization() {
  return (
    <HelpLayout
      title="Categorias, Times, Clientes & Contatos"
      subtitle="Como organizar a operação."
    >
      <h2>Categorias</h2>
      <p>
        Categorias são compartilhadas entre chamados e base de conhecimento. Use uma única lista
        para evitar duplicação. Cada categoria tem nome, descrição e cor (usada como bullet em
        listagens).
      </p>
      <p>
        Apenas <strong>admins</strong> criam/editam categorias em <code>/categories</code> (ou em{' '}
        <em>Configurações → Categorias</em>).
      </p>

      <h2>Times</h2>
      <p>
        Times agrupam agentes por especialidade (ex.: "Suporte L1", "Financeiro", "Engenharia").
        Quando uma <em>Regra de Atribuição</em> aponta para um time, o sistema escolhe
        automaticamente o membro com menos chamados abertos (round-robin).
      </p>
      <p>
        Para adicionar membros, abra o time em <code>/teams/:id</code> e clique em{' '}
        <strong>Adicionar membro</strong>. Cada membro pode ser <em>Membro</em> ou <em>Lead</em>.
      </p>

      <h2>Clientes (organizações)</h2>
      <p>
        Cliente representa a empresa/organização. Tem nome, website, setor e notas. Útil quando você
        atende várias pessoas da mesma empresa e quer agrupar relatórios por cliente.
      </p>

      <h2>Contatos (pessoas)</h2>
      <p>
        Contatos são pessoas vinculadas a um cliente. Têm e-mail, telefone, celular e podem
        opcionalmente estar conectados a um usuário do sistema (caso o contato também tenha login).
      </p>

      <h2>Hierarquia conceitual</h2>
      <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3">
        {`Cliente (organização)
└─ Contato (pessoa)
   └─ Chamado (abre em nome do contato/cliente)`}
      </pre>
    </HelpLayout>
  )
}
