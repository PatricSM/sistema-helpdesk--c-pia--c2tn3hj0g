import { HelpLayout } from './HelpLayout'

export function HelpNotifications() {
  return (
    <HelpLayout title="Notificações" subtitle="Quando e por que você recebe alertas no sistema.">
      <h2>Onde aparecem</h2>
      <p>
        Acesse pela barra lateral em <strong>Notificações</strong>. Cada agente vê apenas as suas.
        Notificações lidas continuam visíveis (com fundo branco) — não-lidas ficam destacadas com
        fundo azul claro e bullet azul à direita.
      </p>

      <h2>Tipos de notificação</h2>
      <ul>
        <li>
          <strong>Atribuição</strong> — você foi designado a um chamado (manual ou via regra de
          atribuição)
        </li>
        <li>
          <strong>Resposta</strong> — alguém comentou em um chamado em que você é solicitante ou
          assignee
        </li>
        <li>
          <strong>Status</strong> — status do seu chamado mudou (resolvido, fechado, etc.). Também
          usado para alertas de SLA estourado.
        </li>
        <li>
          <strong>Menção</strong> — você foi citado em uma nota interna
        </li>
      </ul>

      <h2>Quem recebe o quê</h2>
      <ul>
        <li>
          Comentário público em chamado: notifica <em>solicitante</em> e <em>assignee</em> (não
          notifica o autor da resposta).
        </li>
        <li>
          Nota interna: notifica apenas o <em>assignee</em> (cliente não é alertado).
        </li>
        <li>
          Mudança de status feita por staff: notifica o <em>solicitante</em>.
        </li>
        <li>
          SLA estourado: notifica <em>assignee</em> (ou solicitante se não houver assignee).
        </li>
      </ul>

      <h2>Marcar como lidas</h2>
      <p>
        Clicar na notificação marca como lida e leva ao chamado relacionado. Use{' '}
        <strong>Marcar todas como lidas</strong> no canto superior direito para limpar a lista.
      </p>

      <h2>Implementação</h2>
      <p>
        Notificações são criadas por hooks server-side (PocketBase) que rodam a cada evento
        relevante. Não há fila externa — tudo é gravado direto na coleção <code>notifications</code>
        .
      </p>
    </HelpLayout>
  )
}
