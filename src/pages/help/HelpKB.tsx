import { HelpLayout } from './HelpLayout'

export function HelpKB() {
  return (
    <HelpLayout
      title="Base de Conhecimento"
      subtitle="Como organizar artigos públicos para autoatendimento."
    >
      <h2>Estrutura</h2>
      <p>
        A base é organizada em <strong>categorias</strong> (compartilhadas com chamados) e{' '}
        <strong>artigos</strong>. Cada artigo pertence a uma categoria e tem um autor (staff que
        escreveu).
      </p>

      <h2>Quem vê o quê</h2>
      <ul>
        <li>
          <strong>Clientes</strong> só veem a tela pública (rota <code>/kb-public</code>) com folder
          cards das categorias e busca por título/conteúdo.
        </li>
        <li>
          <strong>Staff</strong> vê a tela administrativa em <code>/knowledge-base</code> com tabs
          Categorias/Artigos, lista densa em tabela, e botão <em>+ Create</em> para novo artigo.
        </li>
      </ul>

      <h2>Editor</h2>
      <p>
        Artigos usam um editor rich-text (Tiptap) com toolbar para títulos (H1/H2), negrito,
        itálico, tachado, listas, citação, código e links. O conteúdo é salvo como HTML.
      </p>

      <h2>Workflow recomendado</h2>
      <ol>
        <li>Crie categorias amplas (ex.: "Conta", "Pagamentos", "Onboarding").</li>
        <li>
          Para cada chamado recorrente, crie um artigo respondendo o caso. Use exemplos práticos.
        </li>
        <li>Atualize artigos quando produto mudar — a data de atualização aparece na lista.</li>
        <li>
          Em respostas a clientes, cole o link do artigo público para reduzir trabalho repetido.
        </li>
      </ol>

      <h2>Feedback</h2>
      <p>
        Ao final de cada artigo, leitores marcam <em>Sim/Não</em> sobre utilidade. Use os artigos
        com baixo "Sim" como sinal de que precisam reescrita.
      </p>
    </HelpLayout>
  )
}
