import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, AtSign, Ticket, MessageCircle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { EmptyState } from '@/components/EmptyState'
import { Pill } from '@/components/Pill'
import {
  getMyNotifications,
  markRead,
  markAllRead,
  NotificationRecord,
  NotificationKind,
} from '@/services/notifications'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const KIND_ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  ticket_assigned: UserPlus,
  ticket_replied: MessageCircle,
  ticket_status_changed: Ticket,
  mention: AtSign,
}

const KIND_LABEL: Record<NotificationKind, string> = {
  ticket_assigned: 'Atribuição',
  ticket_replied: 'Resposta',
  ticket_status_changed: 'Status',
  mention: 'Menção',
}

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function Notifications() {
  const { toast } = useToast()
  const [items, setItems] = useState<NotificationRecord[]>([])

  const load = async () => {
    try {
      setItems(await getMyNotifications())
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('notifications', load)

  const unread = items.filter((n) => !n.read_at)

  return (
    <>
      <PageHeader>
        <PageTitle
          title="Notificações"
          icon={Bell}
          rightSlot={
            unread.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={async () => {
                  await markAllRead()
                  toast({ title: 'Todas marcadas como lidas' })
                  load()
                }}
              >
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas
              </Button>
            ) : null
          }
        />
      </PageHeader>

      <div className="px-5 py-5 max-w-3xl">
        {items.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {items.map((n) => {
                  const Icon = KIND_ICON[n.kind] || Bell
                  const isUnread = !n.read_at
                  const linkTo = n.ticket ? `/tickets/${n.ticket}` : '#'
                  return (
                    <li key={n.id}>
                      <Link
                        to={linkTo}
                        onClick={() =>
                          isUnread &&
                          markRead(n.id)
                            .then(load)
                            .catch(() => {})
                        }
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
                          isUnread && 'bg-blue-50/40',
                        )}
                      >
                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {n.title}
                            </span>
                            <Pill color="gray" label={KIND_LABEL[n.kind]} />
                          </div>
                          {n.body && <p className="text-sm text-gray-600 line-clamp-2">{n.body}</p>}
                          <p className="text-xs text-gray-500 mt-1">{formatRelative(n.created)}</p>
                        </div>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={Bell}
            title="Sem notificações"
            description="Notificações de chamados aparecerão aqui."
          />
        )}
      </div>
    </>
  )
}
