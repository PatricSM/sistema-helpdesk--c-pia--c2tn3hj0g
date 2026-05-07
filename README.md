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

### Configuração da URL do app (necessária para o modal /docs)

Para que a validação de origem (CORS/Same-Origin) funcione automaticamente no modal interno de suporte (`/docs`), o backend precisa saber qual é a URL oficial do seu frontend. Configure isso de uma das duas formas abaixo:
- **No Painel Admin do PocketBase**: Vá em *Settings* → *Application URL* e defina a URL do seu frontend (ex: `https://meusite.com`).
- **Via Variável de Ambiente**: Defina a variável `EMBED_BASE_URL` ou `VITE_EMBED_BASE_URL` no ambiente do backend.

Isso garante que formulários carregados na própria aplicação funcionem sem precisar adicionar a URL manualmente na lista de origens permitidas.

### Configuração do Resend

Para o funcionamento correto dos e-mails transacionais e recebimento de tickets por e-mail, é necessário configurar o Resend com os seguintes passos:
- **Verificar o domínio**: No painel do Resend, configure os **DKIM/SPF records** em seu provedor de DNS para garantir a entrega.
- **Registros MX inbound**: Configure os **MX inbound records** em seu DNS para habilitar o recebimento de e-mails para o domínio.
- **Webhook URL**: Configure a **Webhook URL para incoming emails** no painel do Resend para que as mensagens recebidas sejam enviadas para o seu backend.

### Configuração do Formulário Público (Embed Form & Docs)

Para o funcionamento do formulário de abertura de chamados via Embed ou na Base de Conhecimento Pública, é necessário configurar a chave de embed:
- **Gerar Embed Key**: Acesse o painel de configurações do sistema (Settings -> Embed Forms), crie um novo Embed Form e copie a chave gerada.
- **Configurar Variável de Ambiente**: Defina a chave copiada na variável `VITE_DOCS_EMBED_KEY` no arquivo `.env`.
- **Origens Permitidas**: Same-origin (modal /docs do próprio app) é sempre permitido, independente do allowed_origins da embed_key. Use allowed_origins apenas para liberar sites EXTERNOS que vão hospedar o iframe.
> A page pública /docs (modal "Ainda Tenho Dúvida") depende de Settings → Application URL estar setado corretamente no PB Admin. Se estiver vazio, criar a embed_key da Docs e adicionar a URL do app em allowed_origins.

### Proteção Anti-Spam (Embed Form)

O formulário público de abertura de chamados (embed e docs) está protegido por uma camada de defesa passiva contra bots:
- **Honeypot**: Um campo invisível que atrai bots, rejeitando submissões que o preenchem.
- **Time Check**: Verifica se o tempo de preenchimento foi realista (maior que 2 segundos).
- **Rate Limit**: Bloqueia excesso de requisições do mesmo IP (máx. 5 por hora).
- **Origin Allowlist**: Bloqueia submissões de domínios não autorizados na configuração do Embed Key.

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
