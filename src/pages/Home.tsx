import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Home as HomeIcon,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { Pill } from '@/components/Pill'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getTickets, TicketRecord } from '@/services/tickets'

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}
const STATUS_COLOR: Record<string, string> = {
  open: 'red',
  in_progress: 'amber',
  resolved: 'green',
  closed: 'gray',
}

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  hint?: string
}

function KpiCard({ label, value, icon: Icon, hint }: KpiCardProps) {
  return (
    <Card className="border-gray-200 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <Icon className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
        </div>
        <p className="text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
        {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<TicketRecord[]>([])

  const load = async () => {
    try {
      setTickets(await getTickets())
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('tickets', load)

  const myTickets = useMemo(() => tickets.filter((t) => t.assignee === user?.id), [tickets, user])
  const pending = useMemo(
    () =>
      tickets
        .filter((t) => t.status === 'open' || t.status === 'in_progress')
        .sort((a, b) => (a.created < b.created ? 1 : -1))
        .slice(0, 6),
    [tickets],
  )

  const counts = useMemo(() => {
    return {
      open: tickets.filter((t) => t.status === 'open').length,
      inProgress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      urgent: tickets.filter((t) => t.priority === 'urgent' && t.status !== 'closed').length,
      myActive: myTickets.filter((t) => t.status !== 'closed' && t.status !== 'resolved').length,
    }
  }, [tickets, myTickets])

  const avgFirstResponse = useMemo(() => {
    const responded = tickets.filter((t) => t.first_response_at)
    if (responded.length === 0) return '—'
    const totalMs = responded.reduce(
      (sum, t) => sum + (new Date(t.first_response_at!).getTime() - new Date(t.created).getTime()),
      0,
    )
    const avgMins = Math.floor(totalMs / responded.length / 60000)
    if (avgMins < 60) return `${avgMins}min`
    return `${Math.floor(avgMins / 60)}h ${avgMins % 60}min`
  }, [tickets])

  const last7Days = useMemo(() => {
    const days: { day: string; count: number; resolved: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const dayLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      const count = tickets.filter((t) => t.created.slice(0, 10) === key).length
      const resolved = tickets.filter((t) => t.resolution_at?.slice(0, 10) === key).length
      days.push({ day: dayLabel, count, resolved })
    }
    return days
  }, [tickets])

  const maxCount = Math.max(...last7Days.map((d) => Math.max(d.count, d.resolved)), 1)

  return (
    <>
      <PageHeader>
        <PageTitle title="Início" icon={HomeIcon} />
      </PageHeader>

      <div className="px-6 py-6 space-y-6 max-w-7xl">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Olá, {user?.name?.split(' ')[0] || 'usuário'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Aqui está o panorama do seu helpdesk.</p>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Meus" value={counts.myActive} icon={Inbox} />
          <KpiCard label="Abertos" value={counts.open} icon={Inbox} />
          <KpiCard label="Em andamento" value={counts.inProgress} icon={Clock} />
          <KpiCard label="Urgentes" value={counts.urgent} icon={AlertTriangle} />
          <KpiCard label="Resolvidos" value={counts.resolved} icon={CheckCircle2} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-gray-200 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Tempo médio de primeira resposta
              </p>
              <p className="text-2xl font-semibold tracking-tight">{avgFirstResponse}</p>
              <p className="text-xs text-gray-500 mt-2">
                Sobre {tickets.filter((t) => t.first_response_at).length} chamados respondidos
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-none lg:col-span-2">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pendentes
                </p>
                <Link
                  to="/tickets"
                  className="text-xs text-gray-700 hover:text-gray-900 inline-flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {pending.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {pending.map((t) => (
                    <li key={t.id}>
                      <Link
                        to={`/tickets/${t.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/60"
                      >
                        <Pill
                          bullet
                          color={STATUS_COLOR[t.status]}
                          label={STATUS_LABEL[t.status]}
                        />
                        <span className="flex-1 truncate text-sm font-medium text-gray-900">
                          {t.title}
                        </span>
                        {t.expand?.assignee && (
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={`https://img.usecurling.com/ppl/thumbnail?seed=${t.expand.assignee.id}`}
                            />
                            <AvatarFallback className="text-[9px]">
                              {t.expand.assignee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="text-xs text-gray-400 w-10 text-right shrink-0">
                          {formatRelative(t.created)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">Sem chamados pendentes.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Últimos 7 dias
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-gray-900" /> Criados
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Resolvidos
                </span>
              </div>
            </div>
            <div className="flex items-end gap-3 h-44 mt-4">
              {last7Days.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end gap-1">
                    <div
                      className="flex-1 bg-gray-900 rounded-sm hover:opacity-80 transition-opacity relative"
                      style={{ height: `${(d.count / maxCount) * 100}%` }}
                    >
                      {d.count > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 font-medium">
                          {d.count}
                        </span>
                      )}
                    </div>
                    <div
                      className="flex-1 bg-emerald-500 rounded-sm hover:opacity-80 transition-opacity relative"
                      style={{ height: `${(d.resolved / maxCount) * 100}%` }}
                    >
                      {d.resolved > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 font-medium">
                          {d.resolved}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-500">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
