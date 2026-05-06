import { HelpLayout } from './HelpLayout'

const Code = ({ children }: { children: React.ReactNode }) => (
  <pre className="not-prose text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto">
    {children}
  </pre>
)

export function HelpAPI() {
  return (
    <HelpLayout title="API" subtitle="Referência rápida para integrar com o Helpdesk via API REST.">
      <p>
        O backend usa{' '}
        <a href="https://pocketbase.io" target="_blank" rel="noreferrer">
          PocketBase
        </a>
        . A URL base é definida pela variável <code>VITE_POCKETBASE_URL</code> do front. Para
        autenticar, faça login com email/senha e use o token em cada requisição.
      </p>

      <h2>Autenticação</h2>
      <Code>{`POST /api/collections/users/auth-with-password
Content-Type: application/json

{
  "identity": "agent@empresa.com",
  "password": "********"
}

# resposta (200)
{
  "token": "eyJhbGciOiJIUzI1...",
  "record": { "id": "...", "email": "...", "role": "agent", ... }
}`}</Code>
      <p>
        Use o <code>token</code> em todas as próximas chamadas:
      </p>
      <Code>{`Authorization: <token>`}</Code>

      <h2>Listar chamados</h2>
      <Code>{`GET /api/collections/tickets/records?expand=category,requester,assignee&sort=-created
Authorization: <token>`}</Code>

      <h2>Criar chamado</h2>
      <Code>{`POST /api/collections/tickets/records
Authorization: <token>
Content-Type: application/json

{
  "title": "Erro ao acessar dashboard",
  "description": "Recebo 500 ao abrir /dashboard",
  "status": "open",
  "priority": "high",
  "category": "<category_id>",
  "requester": "<user_id>"
}`}</Code>

      <h2>Adicionar comentário</h2>
      <p>
        Use <code>multipart/form-data</code> para incluir anexos:
      </p>
      <Code>{`POST /api/collections/comments/records
Authorization: <token>
Content-Type: multipart/form-data

ticket=<ticket_id>
author=<user_id>
body=Atualizando: enviei o patch agora.
is_internal=false
attachments=@file1.png
attachments=@file2.pdf`}</Code>

      <h2>Realtime</h2>
      <p>
        O front usa o hook <code>useRealtime(name, callback)</code> (em{' '}
        <code>src/hooks/use-realtime.ts</code>) que assina eventos da coleção (<code>create</code>,{' '}
        <code>update</code>, <code>delete</code>) e cancela automaticamente no unmount. É como o
        painel atualiza sem refresh.
      </p>

      <h2>Coleções principais</h2>
      <ul>
        <li>
          <code>users</code> — auth (campos: name, role, avatar)
        </li>
        <li>
          <code>tickets</code> — chamados
        </li>
        <li>
          <code>comments</code> — respostas (suporta is_internal e attachments)
        </li>
        <li>
          <code>categories</code> — compartilhada com KB
        </li>
        <li>
          <code>knowledge_base</code> — artigos
        </li>
        <li>
          <code>customers</code> / <code>contacts</code> / <code>teams</code> /{' '}
          <code>team_members</code>
        </li>
        <li>
          <code>sla_policies</code> / <code>assignment_rules</code>
        </li>
        <li>
          <code>notifications</code> — uma por usuário
        </li>
        <li>
          <code>settings</code> — key-value de configurações gerais
        </li>
        <li>
          <code>list_views</code> — visões salvas (filtros/sort/colunas)
        </li>
        <li>
          <code>canned_responses</code> — modelos de resposta por agente
        </li>
      </ul>

      <h2>RLS (regras de acesso)</h2>
      <p>
        Cada coleção tem regras de listagem/visualização/criação/atualização/exclusão. O modelo é
        RBAC (admin/agent/client). Por exemplo, em <code>tickets</code>:
      </p>
      <ul>
        <li>
          Cliente só vê chamados onde é o <code>requester</code>
        </li>
        <li>Agente/admin vê todos</li>
        <li>Apenas admin pode deletar</li>
      </ul>
    </HelpLayout>
  )
}
