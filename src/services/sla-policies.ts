import pb from '@/lib/pocketbase/client'

export type SlaPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface SlaPolicyRecord {
  id: string
  name: string
  description?: string
  priority?: SlaPriority
  response_time_min?: number
  resolution_time_min?: number
  business_hours_only?: boolean
  is_active?: boolean
  created: string
  updated: string
}

export const getSlaPolicies = () =>
  pb.collection('sla_policies').getFullList<SlaPolicyRecord>({ sort: 'name' })

export const createSlaPolicy = (data: Partial<SlaPolicyRecord>) =>
  pb.collection('sla_policies').create<SlaPolicyRecord>(data)

export const updateSlaPolicy = (id: string, data: Partial<SlaPolicyRecord>) =>
  pb.collection('sla_policies').update<SlaPolicyRecord>(id, data)

export const deleteSlaPolicy = (id: string) => pb.collection('sla_policies').delete(id)
