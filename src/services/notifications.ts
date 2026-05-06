import pb from '@/lib/pocketbase/client'

export type NotificationKind =
  | 'ticket_assigned'
  | 'ticket_replied'
  | 'ticket_status_changed'
  | 'mention'

export interface NotificationRecord {
  id: string
  recipient: string
  kind: NotificationKind
  title: string
  body?: string
  ticket?: string
  read_at?: string
  created: string
}

export const getMyNotifications = () =>
  pb.collection('notifications').getFullList<NotificationRecord>({ sort: '-created' })

export const markRead = (id: string) =>
  pb.collection('notifications').update<NotificationRecord>(id, {
    read_at: new Date().toISOString(),
  })

export const markAllRead = async () => {
  const list = await pb
    .collection('notifications')
    .getFullList<NotificationRecord>({ filter: 'read_at = null' })
  await Promise.all(list.map((n) => markRead(n.id)))
}
