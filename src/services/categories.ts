import pb from '@/lib/pocketbase/client'

export interface CategoryRecord {
  id: string
  name: string
  description?: string
  color?: string
  created: string
  updated: string
}

export const getCategories = () =>
  pb.collection('categories').getFullList<CategoryRecord>({ sort: 'name' })

export const createCategory = (data: Partial<CategoryRecord>) =>
  pb.collection('categories').create<CategoryRecord>(data)

export const updateCategory = (id: string, data: Partial<CategoryRecord>) =>
  pb.collection('categories').update<CategoryRecord>(id, data)

export const deleteCategory = (id: string) => pb.collection('categories').delete(id)
