import { Link } from 'react-router-dom'
import { Calendar, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

interface TicketLike {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  created: string
  expand?: {
    requester?: { id: string; name: string }
    assignee?: { id: string; name: string }
    category?: { id: string; name: string; color?: string }
  }
}

export function TicketCard({ ticket }: { ticket: TicketLike }) {
  return (
    <Link to={`/tickets/${ticket.id}`}>
      <Card className="border-gray-200 shadow-none hover:border-gray-300 transition-colors h-full">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h3 className="font-medium text-sm text-gray-900 leading-snug line-clamp-2">
            {ticket.title}
          </h3>
          {ticket.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {ticket.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
            {ticket.expand?.requester?.name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" strokeWidth={1.5} />
                {ticket.expand.requester.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" strokeWidth={1.5} />
              {formatDate(ticket.created)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
