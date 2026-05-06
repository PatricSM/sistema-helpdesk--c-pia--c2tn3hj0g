import pb from '@/lib/pocketbase/client'

export interface ContactRecord {
  id: string
  name: string
  email?: string
  phone?: string
  mobile?: string
  customer?: string
  user?: string
  notes?: string
  created: string
  updated: string
  expand?: {
    customer?: { id: string; name: string }
    user?: { id: string; name: string; email: string }
  }
}

export const getContacts = () =>
  pb.collection('contacts').getFullList<ContactRecord>({ sort: 'name', expand: 'customer,user' })

export const getContact = (id: string) =>
  pb.collection('contacts').getOne<ContactRecord>(id, { expand: 'customer,user' })

export const createContact = (data: Partial<ContactRecord>) =>
  pb.collection('contacts').create<ContactRecord>(data)

export const updateContact = (id: string, data: Partial<ContactRecord>) =>
  pb.collection('contacts').update<ContactRecord>(id, data)

export const deleteContact = (id: string) => pb.collection('contacts').delete(id)
