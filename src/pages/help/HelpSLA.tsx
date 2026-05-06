import { HelpLayout } from './HelpLayout'

export function HelpSLA() {
  return (
    <HelpLayout
      title="SLA — Políticas e regras de atribuição"
      subtitle="Como garantir tempos de atendimento e roteamento automático."
    >
      <h2>O que é SLA aqui</h2>
      <p>
        Cada <strong>Política de SLA</strong> define, para uma prioridade específica, o tempo máximo
        de:
      </p>
      <ul>
        <li>
          <code>response_time_min</code> — primeira resposta de um agente (em minutos)
        </li>
        <li>
          <code>resolution_time_min</code> — resolução completa do chamado (em minutos)
        </li>
      </ul>
      <p>
        Configurações em <em>Configurações → Políticas de SLA</em>. Quando ativa, ao criar um
        chamado o sistema preenche automaticamente <code>sla_response_due</code> e{' '}
        <code>sla_resolution_due</code>.
      </p>

      <h2>O que acontece quando estoura</h2>
      <p>Um cron a cada 15 minutos verifica chamados em aberto que passaram do prazo:</p>
      <ul>
        <li>
          Marca o ticket com <code>sla_response_breached = true</code> ou{' '}
          <code>sla_resolution_breached = true</code> (idempotente — só notifica uma vez)
        </li>
        <li>
          Cria uma <strong>notificação</strong> para o agente atribuído (ou para o solicitante se
          não houver atribuição) com título <em>"SLA de resposta estourado"</em>
        </li>
      </ul>

      <h2>Regras de Atribuição</h2>
      <p>
        Em <em>Configurações → Regras de Atribuição</em>, defina condições (prioridade e/ou
        categoria) → ação (atribuir a um agente fixo ou a um time). Ordem importa — regras com{' '}
        <code>priority_order</code> menor são avaliadas primeiro.
      </p>

      <h2>Round-robin de time</h2>
      <p>
        Se uma regra aponta para um time (sem agente fixo), o sistema escolhe entre os membros do
        time aquele com <strong>menos chamados abertos</strong> (status <code>open</code> ou{' '}
        <code>in_progress</code>).
      </p>

      <h2>Recomendações</h2>
      <ul>
        <li>
          Comece com <strong>1 política por prioridade</strong> (4 políticas total).
        </li>
        <li>
          Defina <code>response_time</code> bem menor que <code>resolution_time</code>. Tipicamente:
          30 min de resposta vs 4–24h de resolução para urgência alta.
        </li>
        <li>
          Use <em>business_hours_only</em> se sua equipe não atende 24/7 (a flag está no schema mas
          o cálculo de horário comercial precisa ser implementado conforme fuso/calendário da
          empresa).
        </li>
      </ul>
    </HelpLayout>
  )
}
