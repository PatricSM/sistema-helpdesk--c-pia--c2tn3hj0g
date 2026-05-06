import pb from '@/lib/pocketbase/client'

export interface CommentRecord {
  id: string
  ticket: string
  author: string
  body: string
  is_internal?: boolean
  attachments?: string[]
  created: string
  updated: string
  expand?: { author?: { id: string; name: string; role?: string } }
}

interface CreateCommentInput {
  ticket: string
  author: string
  body: string
  is_internal?: boolean
  files?: File[] | FileList | null
}

export const getComments = (ticketId: string) =>
  pb.collection('comments').getFullList<CommentRecord>({
    filter: `ticket = "${ticketId}"`,
    sort: 'created',
    expand: 'author',
  })

export const createComment = (input: CreateCommentInput) => {
  const fd = new FormData()
  fd.append('ticket', input.ticket)
  fd.append('author', input.author)
  fd.append('body', input.body)
  if (input.is_internal) fd.append('is_internal', 'true')
  if (input.files) {
    const arr = Array.from(input.files as ArrayLike<File>)
    for (const f of arr) fd.append('attachments', f)
  }
  return pb.collection('comments').create<CommentRecord>(fd)
}

/** URL pública/protegida do PocketBase para download do anexo */
export const getAttachmentUrl = (record: CommentRecord, filename: string) =>
  pb.files.getURL(record, filename)
