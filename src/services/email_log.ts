import pb from '@/lib/pocketbase/client'

export interface EmailLogFilters {
  direction?: string
  status?: string
}

export const getEmailLogsList = (page: number, filters: EmailLogFilters) => {
  const parts = []
  if (filters.direction && filters.direction !== 'all')
    parts.push(`direction='${filters.direction}'`)
  if (filters.status && filters.status !== 'all') parts.push(`status='${filters.status}'`)

  return pb.collection('email_log').getList(page, 50, {
    sort: '-created',
    filter: parts.join(' && '),
    expand: 'ticket',
  })
}

export const getEmailLogStats = async () => {
  const date = new Date()
  date.setDate(date.getDate() - 30)

  const records = await pb.collection('email_log').getFullList({
    filter: `created >= '${date.toISOString().replace('T', ' ')}' && direction = 'out'`,
    fields: 'status',
  })

  const total = records.length
  const delivered = records.filter((r) => r.status === 'delivered').length
  const bounced = records.filter((r) => r.status === 'bounced').length

  return {
    totalSent: total,
    deliveredPercentage: total > 0 ? (delivered / total) * 100 : 0,
    bouncedPercentage: total > 0 ? (bounced / total) * 100 : 0,
  }
}
