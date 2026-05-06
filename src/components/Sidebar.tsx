import {
  Search as SearchIcon,
  Bell,
  Home,
  LayoutDashboard,
  Ticket,
  BookOpen,
  Building2,
  Contact2,
  Users,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  HelpCircle,
  MessageSquareQuote,
  Tag,
  LifeBuoy,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSidebarState } from '@/hooks/use-sidebar-state'
import { SidebarLink } from './SidebarLink'
import { SidebarSection } from './SidebarSection'
import { UserMenu } from './UserMenu'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  to: string
}

const agentItems: NavItem[] = [
  { label: 'Início', icon: Home, to: '/home' },
  { label: 'Painel', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Chamados', icon: Ticket, to: '/tickets' },
  { label: 'Base de Conhecimento', icon: BookOpen, to: '/knowledge-base' },
  { label: 'Clientes', icon: Building2, to: '/customers' },
  { label: 'Contatos', icon: Contact2, to: '/contacts' },
]

const customerItems: NavItem[] = [
  { label: 'Meus Chamados', icon: Ticket, to: '/my-tickets' },
  { label: 'Base de Conhecimento', icon: BookOpen, to: '/kb-public' },
]

const adminItems: NavItem[] = [
  { label: 'Respostas Prontas', icon: MessageSquareQuote, to: '/canned-responses' },
  { label: 'Categorias', icon: Tag, to: '/categories' },
  { label: 'Times', icon: Users, to: '/teams' },
  { label: 'Agentes', icon: Users, to: '/agents' },
  { label: 'Configurações', icon: SettingsIcon, to: '/settings' },
]

export function Sidebar() {
  const { user } = useAuth()
  const { isExpanded, toggle, width } = useSidebarState()
  const isAdmin = user?.role === 'admin'
  const isClient = user?.role === 'client'

  const mainItems = isClient ? customerItems : agentItems
  const showAdminSection = isAdmin

  // notificações: placeholder até termos coleção `notifications`
  const unread = 0

  return (
    <div
      className="flex select-none flex-col border-r border-gray-200 bg-gray-50 text-base transition-all duration-300 ease-in-out h-full overflow-hidden"
      style={{ minWidth: width, maxWidth: width }}
    >
      <div className={isExpanded ? 'mx-0 p-2' : 'm-2'}>
        <UserMenu compact={!isExpanded} />
      </div>

      {!isClient && (
        <SidebarLink
          icon={SearchIcon}
          label="Buscar"
          to="/search"
          isExpanded={isExpanded}
          className="mt-1.5"
          rightSlot={
            <span className="flex items-center gap-0.5 font-medium text-gray-600 text-xs">
              <span>⌘</span>
              <span>K</span>
            </span>
          }
        />
      )}

      {!isClient && (
        <div className="relative">
          {unread > 0 && (
            <div className="absolute size-1.5 translate-x-6 translate-y-1 rounded-full bg-blue-400 left-1" />
          )}
          <SidebarLink
            icon={Bell}
            label="Notificações"
            to="/notifications"
            isExpanded={isExpanded}
            className="my-0.5"
            rightSlot={
              isExpanded && unread > 0 ? (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                  {unread > 9 ? '9+' : unread}
                </Badge>
              ) : null
            }
          />
        </div>
      )}

      <div className="overflow-y-auto overflow-x-hidden flex-1">
        <div className="mx-2 my-2.5" />
        <SidebarSection label="All Views" hideLabel isExpanded={isExpanded}>
          {mainItems.map((item) => (
            <SidebarLink
              key={item.label}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isExpanded={isExpanded}
              className="my-0.5"
            />
          ))}
        </SidebarSection>

        {showAdminSection && (
          <>
            <div className="mx-2 my-2.5" />
            <SidebarSection label="Configurações" defaultOpen isExpanded={isExpanded}>
              {adminItems.map((item) => (
                <SidebarLink
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  isExpanded={isExpanded}
                  className="my-0.5"
                />
              ))}
            </SidebarSection>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 pb-2.5">
        {!isClient && (
          <SidebarLink icon={HelpCircle} label="Ajuda" to="/help" isExpanded={isExpanded} />
        )}
        <SidebarLink
          icon={isExpanded ? ArrowLeftFromLine : ArrowRightFromLine}
          label={isExpanded ? 'Recolher' : 'Expandir'}
          isExpanded={isExpanded}
          onClick={toggle}
        />
      </div>
    </div>
  )
}

// Re-exporta LifeBuoy para uso eventual (logo Skip)
export { LifeBuoy }
