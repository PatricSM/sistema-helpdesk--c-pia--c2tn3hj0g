import { HelpLayout } from './HelpLayout'

export function HelpTickets() {
  return (
    <HelpLayout title="Chamados" subtitle="Como criar, atribuir, responder e resolver chamados.">
      <h2>Abrir um chamado</h2>
      <ol>
        <li>
          Clique em <strong>+ Create</strong> no canto superior direito da tela <em>Chamados</em>{' '}
          (ou no atalho do <em>Painel</em>).
        </li>
        <li>
          Preencha título, descrição, categoria e prioridade. Status inicial é <code>Aberto</code>.
        </li>
        <li>
          Clientes abrem chamados em nome próprio. Staff (agentes/admins) podem abrir em nome de
          qualquer pessoa selecionando o solicitante.
        </li>
      </ol>

      <h2>Status</h2>
      <ul>
        <li>
          <strong>Aberto</strong> — recém-criado, sem assignee ou aguardando primeira resposta
        </li>
        <li>
          <strong>Em andamento</strong> — agente está trabalhando
        </li>
        <li>
          <strong>Resolvido</strong> — solução enviada; <code>resolution_at</code> é marcado
          automaticamente
        </li>
        <li>
          <strong>Fechado</strong> — encerrado. Chamados resolvidos viram fechados automaticamente
          após o número de dias configurado em <em>Configurações → Geral</em> (padrão 7 dias)
        </li>
      </ul>

      <h2>Prioridade e Tipo</h2>
      <p>
        Prioridades: <code>Baixa</code>, <code>Média</code>, <code>Alta</code>, <code>Urgente</code>
        . Tipos: <code>Question</code>, <code>Incident</code>, <code>Bug</code>,{' '}
        <code>Unspecified</code>. Ambos são editáveis na sidebar de detalhes do chamado.
      </p>

      <h2>Atribuição</h2>
      <p>
        Quem clica em <strong>Atribuído a</strong> pode escolher um agente. Se uma{' '}
        <em>Regra de Atribuição</em> baterem com a categoria/prioridade do chamado, o sistema
        atribui automaticamente: ou ao agente fixo da regra, ou ao membro do time com menos chamados
        abertos (round-robin).
      </p>

      <h2>Responder</h2>
      <p>No detalhe do chamado, use o composer no rodapé. Há dois modos:</p>
      <ul>
        <li>
          <strong>Reply</strong> (botão preto): resposta pública, visível para o solicitante
        </li>
        <li>
          <strong>Comment</strong> (botão amarelo, só staff): nota interna, visível apenas para
          staff
        </li>
      </ul>
      <p>
        Você pode anexar até 5 arquivos (10MB cada) clicando em <strong>Anexar</strong>. Para
        acelerar respostas comuns, use o seletor de <em>Resposta pronta</em> à direita.
      </p>

      <h2>SLA e first response</h2>
      <p>
        Quando uma <em>Política de SLA</em> está ativa para a prioridade do chamado, ao criar o
        ticket o sistema calcula <code>sla_response_due</code> e <code>sla_resolution_due</code>.
        Quando staff envia o primeiro comentário público, <code>first_response_at</code> é marcado e
        o cronômetro de resposta é satisfeito.
      </p>

      <h2>Filtros e visões salvas</h2>
      <p>
        Na lista de chamados, use os botões <strong>Filter / Sort / Columns</strong> para ajustar o
        que é mostrado. Depois clique no dropdown <em>Todas as visões</em> →{' '}
        <strong>Salvar visão atual</strong> para guardar essa configuração. Visões podem ser
        privadas (só você) ou públicas (todos os agentes).
      </p>

      <h2>Bulk actions</h2>
      <p>Selecione vários chamados via checkbox para exportar em CSV ou (admin) excluir em lote.</p>
    </HelpLayout>
  )
}
