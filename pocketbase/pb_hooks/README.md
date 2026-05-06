# PocketBase Hooks

Scripts JS executados pelo PocketBase no servidor (Goja runtime). API global `$app`.

## Como o PocketBase carrega arquivos deste diretório

| Padrão | Tratamento |
|---|---|
| `*.pb.js` | Hook script — executado no startup, registra hooks no PB. **Não pode usar `module.exports`** (não é um módulo CommonJS) |
| `*.js` (sem `.pb`) | Módulo CommonJS — pode usar `module.exports`/`require()`. Não é executado no startup, só quando outro hook fizer `require()` |

## Arquivos

| Arquivo | Tipo | O que faz |
|---|---|---|
| `_helpers.js` | módulo | utilitários (`createNotification`, `getSetting`, `findMatchingAssignmentRule`, `findSlaPolicyForPriority`, `addMinutesIso`, `pickTeamMemberRoundRobin`) |
| `tickets.pb.js` | hook | `onRecordCreate`/`onRecordAfterCreateSuccess`/`onRecordUpdate`/`onRecordAfterUpdateSuccess`: aplica SLA, auto-assignment (incluindo round-robin de team), notifica, marca `resolution_at` |
| `comments.pb.js` | hook | `onRecordAfterCreateSuccess`: marca `first_response_at`, notifica requester/assignee |
| `sla_check.pb.js` | cron */15min | detecta SLA estourado e cria notification |
| `auto_close.pb.js` | cron diário 03:00 | fecha tickets resolved há > N dias |

## Gotchas descobertos durante validação

### 1. `module.exports` só funciona em arquivos sem `.pb.js`
PocketBase trata `*.pb.js` como hook scripts top-level. Para usar `module.exports`/`require`, o arquivo deve ter extensão `.js` (sem `.pb`). Por isso `_helpers.js` (não `_helpers.pb.js`).

### 2. Nomes de hooks em PocketBase 0.30
- ✅ `onRecordCreate` — model hook (antes do save, permite modificar `e.record`)
- ✅ `onRecordCreateRequest` — request hook (apenas para validação)
- ✅ `onRecordAfterCreateSuccess` — depois do save com sucesso
- ✅ `onRecordUpdate` / `onRecordAfterUpdateSuccess` — análogos
- ❌ `onRecordBeforeCreateRequest` / `onRecordAfterCreateRequest` — **não existem** (nomes antigos da v0.22)

### 3. Campos `date` retornam objeto truthy mesmo vazio
`record.get('campo_date')` retorna um objeto Date "vazio" que é truthy. Não use `if (!record.get('x'))` — use `if (!String(record.get('x') || '').trim())`.

## Setup local
```bash
cd pocketbase
./pocketbase serve --dev
```

## Testando
1. Crie um ticket priority `high` com SLA policy ativa → `sla_response_due`/`sla_resolution_due` preenchidos.
2. Crie uma assignment rule (priority=high → team=X) → ticket atribuído ao membro do team com menos chamados abertos.
3. Como staff, comente publicamente → `first_response_at` setado, requester recebe notification.
4. Mude status para `resolved` → `resolution_at` setado.
