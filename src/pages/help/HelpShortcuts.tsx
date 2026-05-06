import { HelpLayout } from './HelpLayout'

interface Shortcut {
  keys: string[]
  description: string
}

const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: 'Navegação',
    items: [
      { keys: ['⌘', 'K'], description: 'Abrir busca global (em desenvolvimento)' },
      { keys: ['G', 'H'], description: 'Ir para Início (em desenvolvimento)' },
      { keys: ['G', 'T'], description: 'Ir para Chamados (em desenvolvimento)' },
      { keys: ['G', 'K'], description: 'Ir para Base de Conhecimento (em desenvolvimento)' },
    ],
  },
  {
    group: 'Composer de chamado',
    items: [
      { keys: ['Enter'], description: 'Quebra de linha no editor (Tiptap)' },
      { keys: ['⌘', 'B'], description: 'Negrito' },
      { keys: ['⌘', 'I'], description: 'Itálico' },
      { keys: ['⌘', 'K'], description: 'Inserir link' },
    ],
  },
  {
    group: 'Listas',
    items: [
      { keys: ['Click no header'], description: 'Ordenar pela coluna' },
      { keys: ['Shift + click'], description: 'Selecionar intervalo (em desenvolvimento)' },
      { keys: ['Esc'], description: 'Limpar seleção' },
    ],
  },
]

export function HelpShortcuts() {
  return (
    <HelpLayout title="Atalhos de teclado" subtitle="Aceleradores para tarefas comuns.">
      <p>
        Esta seção lista os atalhos disponíveis. Alguns ainda estão marcados como{' '}
        <em>em desenvolvimento</em> — uma versão futura adicionará binds globais.
      </p>

      {SHORTCUTS.map((group) => (
        <div key={group.group} className="not-prose mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{group.group}</h3>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {group.items.map((s, i) => (
                  <tr
                    key={i}
                    className={i === group.items.length - 1 ? '' : 'border-b border-gray-100'}
                  >
                    <td className="px-4 py-2.5 w-48">
                      <span className="inline-flex items-center gap-1">
                        {s.keys.map((k, idx) => (
                          <kbd
                            key={idx}
                            className="px-1.5 py-0.5 text-[11px] font-mono bg-gray-100 border border-gray-300 rounded shadow-[0_1px_0_rgb(0_0_0_/_0.05)]"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </HelpLayout>
  )
}
