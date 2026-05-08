# Projeto Criado com o Skip

Este projeto foi criado de ponta a ponta com o [Skip](https://goskip.dev).

## 🚀 Stack Tecnológica

- **React 19** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool extremamente rápida
- **TypeScript** - Superset tipado do JavaScript
- **Shadcn UI** - Componentes reutilizáveis e acessíveis
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Roteamento para aplicações React
- **React Hook Form** - Gerenciamento de formulários performático
- **Zod** - Validação de schemas TypeScript-first
- **Recharts** - Biblioteca de gráficos para React

## 📋 Pré-requisitos

- Node.js 18+
- npm

## 🔧 Instalação

```bash
npm install
```

## Variáveis de ambiente

O projeto utiliza variáveis de ambiente para configuração de serviços externos. Consulte o arquivo `.env.example` como referência de configuração.

### Modal "Ainda Tenho Dúvida" e iframe embed

O fluxo de criação pública de tickets agora utiliza a collection nativa `embed_submissions` em conjunto com hooks de backend. O antigo endpoint `/api/embed/tickets` foi removido. Submissões via SDK passam pelas validações de segurança (honeypot, rate limit, time-check) e são processadas automaticamente.

### Configuração do Resend

Para o funcionamento correto dos e-mails transacionais e recebimento de tickets por e-mail, é necessário configurar o Resend com os seguintes passos:
- **Verificar o domínio**: No painel do Resend, configure os **DKIM/SPF records** em seu provedor de DNS para garantir a entrega.
- **Registros MX inbound**: Configure os **MX inbound records** em seu DNS para habilitar o recebimento de e-mails para o domínio.
- **Webhook URL**: Configure a **Webhook URL para incoming emails** no painel do Resend para que as mensagens recebidas sejam enviadas para o seu backend: `https://[APP_DOMAIN]/api/inbound/email`

### Configuração de Eventos do Resend

Para rastrear o status de entrega, bounce e falhas de e-mails enviados:
- **Webhook Events URL**: Configure a **Webhook URL** no painel do Resend para eventos (e.g. `email.delivered`, `email.bounced`, `email.complained`): `https://[APP_DOMAIN]/api/webhook/resend`

> **TODO**: Os endpoints customizados `/api/inbound/email` e `/api/webhook/resend` atualmente enfrentam a mesma restrição do Edge Proxy que impedia o `/api/embed/tickets`. Será necessária uma atualização arquitetural futura (ex: rotas via SDK/Collections ou gateway) para reativar o recebimento via webhooks.

### Configuração do Formulário Público (Embed Form & Docs)

Para o funcionamento do formulário de abertura de chamados via Embed ou na Base de Conhecimento Pública, é necessário configurar a chave de embed:
- **Gerar Embed Key**: Acesse o painel de configurações do sistema (Settings -> Embed Forms), crie um novo Embed Form e copie a chave gerada.
- **Configurar Variável de Ambiente**: Defina a chave copiada na variável `VITE_DOCS_EMBED_KEY` no arquivo `.env`.
- **Origens Permitidas**: A listagem de domínios em "Allowed Origins" serve apenas para anotação interna. O fluxo utiliza chamadas padrão do SDK de forma nativa.

### Proteção Anti-Spam (Embed Form)

O formulário público de abertura de chamados (embed e docs) está protegido por uma camada de defesa contra bots e spans. As seguintes proteções ativas estão em vigor:
- **Embed Key Obrigatória**: Necessária em todas as requisições (pode ser ativada/desativada no painel `/settings`).
- **Honeypot + Time Check**: Campo invisível para despistar bots, e validação se o tempo de preenchimento foi realista (maior que 2 segundos).
- **Rate Limit**: Limite rigoroso de 5 tickets por IP a cada hora.
- **LGPD Obrigatória**: Validação de consentimento obrigatório para uso dos dados.

## 💻 Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm start
# ou
npm run dev
```

Abre a aplicação em modo de desenvolvimento em [http://localhost:5173](http://localhost:5173).

### Build

```bash
# Build para produção
npm run build

# Build para desenvolvimento
npm run build:dev
```

Gera os arquivos otimizados para produção na pasta `dist/`.

### Preview

```bash
# Visualizar build de produção localmente
npm run preview
```

Permite visualizar a build de produção localmente antes do deploy.

### Linting e Formatação

```bash
# Executar linter
npm run lint

# Executar linter e corrigir problemas automaticamente
npm run lint:fix

# Formatar código com Oxfmt
npm run format
```

## 📁 Estrutura do Projeto

```
.
├── src/              # Código fonte da aplicação
├── public/           # Arquivos estáticos
├── dist/             # Build de produção (gerado)
├── node_modules/     # Dependências (gerado)
└── package.json      # Configurações e dependências do projeto
```

## 🎨 Componentes UI

Este template inclui uma biblioteca completa de componentes Shadcn UI baseados em Radix UI:

- Accordion
- Alert Dialog
- Avatar
- Button
- Checkbox
- Dialog
- Dropdown Menu
- Form
- Input
- Label
- Select
- Switch
- Tabs
- Toast
- Tooltip
- E muito mais...

## 📝 Ferramentas de Qualidade de Código

- **TypeScript**: Tipagem estática
- **Oxlint**: Linter extremamente rápido
- **Oxfmt**: Formatação automática de código

## 🔄 Workflow de Desenvolvimento

1. Instale as dependências: `npm install`
2. Inicie o servidor de desenvolvimento: `npm start`
3. Faça suas alterações
4. Verifique o código: `npm run lint`
5. Formate o código: `npm run format`
6. Crie a build: `npm run build`
7. Visualize a build: `npm run preview`

## 📦 Build e Deploy

Para criar uma build otimizada para produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/` e estarão prontos para deploy.
