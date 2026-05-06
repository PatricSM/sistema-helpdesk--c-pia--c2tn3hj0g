import pb from '@/lib/pocketbase/client'

export interface CustomerRecord {
  id: string
  name: string
  website?: string
  industry?: string
  logo?: string
  notes?: string
  created: string
  updated: string
}

export const getCustomers = () =>
  pb.collection('customers').getFullList<CustomerRecord>({ sort: 'name' })

export const getCustomer = (id: string) => pb.collection('customers').getOne<CustomerRecord>(id)

export const createCustomer = (data: Partial<CustomerRecord>) =>
  pb.collection('customers').create<CustomerRecord>(data)

export const updateCustomer = (id: string, data: Partial<CustomerRecord>) =>
  pb.collection('customers').update<CustomerRecord>(id, data)

export const deleteCustomer = (id: string) => pb.collection('customers').delete(id)
