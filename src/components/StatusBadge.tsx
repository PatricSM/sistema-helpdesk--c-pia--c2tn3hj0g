import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  in_progress: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  resolved: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  closed: 'bg-slate-200 text-slate-700 hover:bg-slate-200',
}

export function StatusBadge({
  status,
  className,
}: {
  status: TicketStatus | string
  className?: string
}) {
  const key = (STATUS_LABEL[status as TicketStatus] ? status : 'open') as TicketStatus
  return (
    <Badge variant="secondary" className={cn(STATUS_CLASS[key], className)}>
      {STATUS_LABEL[key]}
    </Badge>
  )
}
