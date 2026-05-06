import pb from '@/lib/pocketbase/client'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketType = 'question' | 'incident' | 'bug' | 'unspecified'

export interface TicketRecord {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type?: TicketType
  category?: string
  requester: string
  assignee?: string
  first_response_at?: string
  resolution_at?: string
  sla_response_due?: string
  sla_resolution_due?: string
  sla_response_breached?: boolean
  sla_resolution_breached?: boolean
  team?: string
  created: string
  updated: string
  expand?: {
    requester?: { id: string; name: string; email: string; role?: string }
    assignee?: { id: string; name: string; email: string; role?: string }
    category?: { id: string; name: string; color?: string }
  }
}

export const getTickets = (filter = '', sort = '-created') =>
  pb.collection('tickets').getFullList<TicketRecord>({
    filter,
    sort,
    expand: 'category,requester,assignee',
  })

export const getTicket = (id: string) =>
  pb.collection('tickets').getOne<TicketRecord>(id, { expand: 'category,requester,assignee' })

export const createTicket = (data: Partial<TicketRecord> & Record<string, unknown>) =>
  pb.collection('tickets').create<TicketRecord>(data)

export const updateTicket = (id: string, data: Partial<TicketRecord> & Record<string, unknown>) =>
  pb.collection('tickets').update<TicketRecord>(id, data)

export const deleteTicket = (id: string) => pb.collection('tickets').delete(id)
