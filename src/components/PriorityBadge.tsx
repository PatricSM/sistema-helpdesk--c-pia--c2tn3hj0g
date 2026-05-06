import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  low: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  medium: 'bg-sky-100 text-sky-800 hover:bg-sky-100',
  high: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  urgent: 'bg-rose-100 text-rose-800 hover:bg-rose-100',
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TicketPriority | string
  className?: string
}) {
  const key = (PRIORITY_LABEL[priority as TicketPriority] ? priority : 'medium') as TicketPriority
  return (
    <Badge variant="secondary" className={cn(PRIORITY_CLASS[key], className)}>
      {PRIORITY_LABEL[key]}
    </Badge>
  )
}
