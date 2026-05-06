import { useState } from 'react'
import {
  HelpCircle,
  Sparkles,
  Ticket,
  BookOpen,
  Tag,
  Timer,
  Bell,
  Keyboard,
  Code,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { cn } from '@/lib/utils'

import { HelpIntro } from './help/HelpIntro'
import { HelpTickets } from './help/HelpTickets'
import { HelpKB } from './help/HelpKB'
import { HelpOrganization } from './help/HelpOrganization'
import { HelpSLA } from './help/HelpSLA'
import { HelpNotifications } from './help/HelpNotifications'
import { HelpShortcuts } from './help/HelpShortcuts'
import { HelpAPI } from './help/HelpAPI'

interface Topic {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  group: string
  component: React.ComponentType
}

const TOPICS: Topic[] = [
  { key: 'intro', label: 'Introdução', icon: Sparkles, group: 'Começando', component: HelpIntro },
  {
    key: 'tickets',
    label: 'Chamados',
    icon: Ticket,
    group: 'Funcionalidades',
    component: HelpTickets,
  },
  {
    key: 'kb',
    label: 'Base de Conhecimento',
    icon: BookOpen,
    group: 'Funcionalidades',
    component: HelpKB,
  },
  {
    key: 'organization',
    label: 'Categorias & Times',
    icon: Tag,
    group: 'Funcionalidades',
    component: HelpOrganization,
  },
  { key: 'sla', label: 'SLA', icon: Timer, group: 'Operação', component: HelpSLA },
  {
    key: 'notifications',
    label: 'Notificações',
    icon: Bell,
    group: 'Operação',
    component: HelpNotifications,
  },
  {
    key: 'shortcuts',
    label: 'Atalhos',
    icon: Keyboard,
    group: 'Avançado',
    component: HelpShortcuts,
  },
  { key: 'api', label: 'API', icon: Code, group: 'Avançado', component: HelpAPI },
]

export default function Help() {
  const [activeKey, setActiveKey] = useState<string>(TOPICS[0].key)

  const grouped = TOPICS.reduce<Record<string, Topic[]>>((acc, t) => {
    acc[t.group] = acc[t.group] || []
    acc[t.group].push(t)
    return acc
  }, {})

  const Active = TOPICS.find((t) => t.key === activeKey)?.component || HelpIntro

  return (
    <>
      <PageHeader>
        <PageTitle title="Ajuda" icon={HelpCircle} />
      </PageHeader>

      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
        <aside className="w-56 shrink-0 border-r border-gray-200 bg-white overflow-y-auto py-4 px-2">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-4">
              <h3 className="px-2 mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                {group}
              </h3>
              <nav className="space-y-0.5">
                {items.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveKey(t.key)}
                    className={cn(
                      'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left transition-colors',
                      activeKey === t.key
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    <t.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="text-sm truncate">{t.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto bg-background">
          <Active />
        </main>
      </div>
    </>
  )
}
