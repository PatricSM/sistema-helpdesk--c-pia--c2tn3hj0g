import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  Cog,
  Timer,
  UserPlus,
  Users,
  Tag,
  GitFork,
  MessageSquareQuote,
  Link2,
  Mail,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

import { SettingsGeneral } from './settings/SettingsGeneral'
import { SettingsSLA } from './settings/SettingsSLA'
import { SettingsInviteAgents } from './settings/SettingsInviteAgents'
import { SettingsAssignmentRules } from './settings/SettingsAssignmentRules'
import { SettingsTeams } from './settings/SettingsTeams'
import { SettingsCategories } from './settings/SettingsCategories'
import { SettingsCannedResponses } from './settings/SettingsCannedResponses'
import { SettingsEmbedKeys } from './settings/SettingsEmbedKeys'
import { SettingsEmailLog } from './settings/SettingsEmailLog'

interface Tab {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  group: string
  component: React.ComponentType
}

const TABS: Tab[] = [
  { key: 'general', label: 'Geral', icon: Cog, group: 'Conta', component: SettingsGeneral },

  { key: 'sla', label: 'Políticas de SLA', icon: Timer, group: 'Operação', component: SettingsSLA },
  {
    key: 'assignment',
    label: 'Regras de Atribuição',
    icon: GitFork,
    group: 'Operação',
    component: SettingsAssignmentRules,
  },

  { key: 'teams', label: 'Times', icon: Users, group: 'Pessoas', component: SettingsTeams },
  {
    key: 'invite',
    label: 'Convidar Agentes',
    icon: UserPlus,
    group: 'Pessoas',
    component: SettingsInviteAgents,
  },

  {
    key: 'categories',
    label: 'Categorias',
    icon: Tag,
    group: 'Domínio',
    component: SettingsCategories,
  },
  {
    key: 'canned',
    label: 'Respostas Prontas',
    icon: MessageSquareQuote,
    group: 'Domínio',
    component: SettingsCannedResponses,
  },
  {
    key: 'embed',
    label: 'Formulários Embed',
    icon: Link2,
    group: 'Integrações',
    component: SettingsEmbedKeys,
  },
  {
    key: 'email',
    label: 'Logs de Email',
    icon: Mail,
    group: 'Auditoria',
    component: SettingsEmailLog,
  },
]

export default function Settings() {
  const { user } = useAuth()
  const [activeKey, setActiveKey] = useState<string>(TABS[0].key)

  if (user?.role !== 'admin') return <Navigate to="/" replace />

  const grouped = TABS.reduce<Record<string, Tab[]>>((acc, t) => {
    acc[t.group] = acc[t.group] || []
    acc[t.group].push(t)
    return acc
  }, {})

  const ActiveComponent = TABS.find((t) => t.key === activeKey)?.component || SettingsGeneral

  return (
    <>
      <PageHeader>
        <PageTitle title="Configurações" icon={SettingsIcon} />
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

        {/* Conteúdo da subseção */}
        <main className="flex-1 overflow-hidden bg-background">
          <ActiveComponent />
        </main>
      </div>
    </>
  )
}
