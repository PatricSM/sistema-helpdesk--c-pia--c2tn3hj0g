# Conformidade Skip — exceções declaradas

Este projeto segue o padrão `skip-template-padrao` mas declara exceções legítimas ao gate `check-conformance.sh` por usar:

- **Modelagem RBAC** (admin / agent / client) em vez do padrão "user é dono de tudo"
- **Coleções com nomes customizados** (`requester/assignee` em tickets, `categories` compartilhada, `knowledge_base`, `comments`)

## Por que essas exceções existem

### `immutable-diff: src/hooks/use-auth.tsx`

`signUp(email, password, name)` cria automaticamente `role: 'client'` para que o cadastro público sempre gere clientes. Admin/agent são criados via seed ou pelo administrador.

### `pb-rls` / `pb-field` em todas as coleções base

Nenhuma coleção usa o campo literal `user`. Usam variantes semanticamente equivalentes:

- **`tickets`**: `requester` (obrigatório, quem abriu) + `assignee` (opcional, quem atende). RLS combina papel (`@request.auth.role`) com `requester = @request.auth.id`.
- **`comments`**: `author` (quem escreveu) + filtro automático de `is_internal` para clientes.
- **`categories`**: gerenciada apenas por `admin` (não tem campo de owner — é compartilhada).
- **`knowledge_base`**: `author` (criador). Acesso total a autenticados; criação/edição apenas para `admin`/`agent`.
- **`canned_responses`**: `owner` (cada agente gerencia as suas; admin vê tudo).

Todas mantêm o invariante de "todo registro está atrelado a um usuário do PocketBase" e o escopo é gated pelo `@request.auth.id` + `@request.auth.role`.

## Saída esperada do gate

```bash
bash ~/.claude/skills/skip-template-padrao/reference/check-conformance.sh \
  /mnt/d/Projetos/POCtemplates/templatesNoSkip/sistema-helpdesk-41dh3t89z
```

**Esperado:** **13 fails** (RBAC):

- 1 `immutable-diff` em `use-auth.tsx` (signUp com role='client')
- pb-rls/pb-field em migrations `0002_create_collections`, `0004_create_canned_responses`, `0008_create_customers_contacts_teams`, `0010_create_notifications`, `0011_create_settings_collections`, `0014_create_list_views`. Todas usam campos de escopo alternativos (`requester`/`assignee`/`author`/`owner`/`recipient`/`key`) e RLS gated por `@request.auth.role`, não pelo literal `user = @request.auth.id`.

Qualquer outra falha é regressão e deve ser corrigida.

## Coleções

| Coleção            | Origem                       | Campo de escopo                        | Quem pode escrever                              |
| ------------------ | ---------------------------- | -------------------------------------- | ----------------------------------------------- |
| `users`            | sistema (auth) + role select | `id = @request.auth.id`                | próprio usuário                                 |
| `categories`       | migration 0002               | `admin` apenas                         | admin                                           |
| `tickets`          | migration 0002               | `requester`/`assignee` + role          | qualquer autenticado cria; agent/admin atualiza |
| `comments`         | migration 0002               | `author` + role + filtro `is_internal` | qualquer autenticado cria                       |
| `knowledge_base`   | migration 0002               | `author` + role                        | admin/agent                                     |
| `canned_responses` | migration 0004               | `owner` + role                         | agent/admin (por owner)                         |

## Setup local

1. `cp .env.example .env` e preencha `VITE_POCKETBASE_URL`.
2. Suba o PocketBase apontando para a pasta `pocketbase/` para que ele aplique as migrations automaticamente.
3. `pnpm install && pnpm dev`.

Usuário admin do seed: `patric.martins@adapta.org` / senha `Skip@Pass`.
