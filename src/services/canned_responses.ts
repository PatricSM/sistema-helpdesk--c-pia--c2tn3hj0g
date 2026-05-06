import pb from '@/lib/pocketbase/client'

export interface CannedResponseRecord {
  id: string
  title: string
  body: string
  shortcut?: string
  owner: string
  created: string
  updated: string
}

export const getCannedResponses = () =>
  pb.collection('canned_responses').getFullList<CannedResponseRecord>({ sort: 'title' })

export const createCannedResponse = (data: Partial<CannedResponseRecord>) =>
  pb
    .collection('canned_responses')
    .create<CannedResponseRecord>({ ...data, owner: pb.authStore.record?.id })

export const updateCannedResponse = (id: string, data: Partial<CannedResponseRecord>) =>
  pb.collection('canned_responses').update<CannedResponseRecord>(id, data)

export const deleteCannedResponse = (id: string) => pb.collection('canned_responses').delete(id)
