import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LifeBuoy, Sparkles, Ticket, BookOpen, Tag, Timer, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOPICS = [
  { key: 'intro', label: 'Introdução', icon: Sparkles, group: 'Começando' },
  { key: 'tickets', label: 'Chamados', icon: Ticket, group: 'Funcionalidades' },
  { key: 'kb', label: 'Base de Conhecimento', icon: BookOpen, group: 'Funcionalidades' },
  { key: 'organization', label: 'Categorias & Times', icon: Tag, group: 'Funcionalidades' },
  { key: 'sla', label: 'SLA', icon: Timer, group: 'Operação' },
  { key: 'notifications', label: 'Notificações', icon: Bell, group: 'Operação' },
]

export function HelpCenterLayout() {
  const { loading } = useAuth()

  const grouped = TOPICS.reduce<Record<string, typeof TOPICS>>((acc, t) => {
    acc[t.group] = acc[t.group] || []
    acc[t.group].push(t)
    return acc
  }, {})

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 font-semibold">
          <LifeBuoy className="w-5 h-5 text-primary" />
          <span>Centro de Ajuda Interno</span>
        </div>
        {!loading && (
          <Button asChild variant="outline" size="sm">
            <Link to="/">Voltar ao app</Link>
          </Button>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-3.5rem)]">
        <aside className="w-64 shrink-0 border-r border-border bg-muted/30 overflow-y-auto py-6 px-4 hidden md:block">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-6">
              <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group}
              </h3>
              <nav className="space-y-1">
                {items.map((t) => (
                  <NavLink
                    key={t.key}
                    to={`/help/${t.key}`}
                    className={({ isActive }) =>
                      cn(
                        'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    <t.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="truncate">{t.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto bg-background px-4 py-6 md:px-8 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
