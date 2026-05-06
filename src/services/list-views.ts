import pb from '@/lib/pocketbase/client'

export interface ListViewRecord {
  id: string
  name: string
  collection_name: string
  filters?: Record<string, string>
  sort_key?: string
  sort_dir?: 'asc' | 'desc'
  columns_hidden?: string[]
  owner: string
  is_public?: boolean
  is_default?: boolean
  created: string
  updated: string
}

export const getListViews = (collectionName: string) =>
  pb.collection('list_views').getFullList<ListViewRecord>({
    filter: `collection_name = "${collectionName}"`,
    sort: '-is_default,name',
  })

export const createListView = (data: Partial<ListViewRecord>) =>
  pb.collection('list_views').create<ListViewRecord>({
    ...data,
    owner: pb.authStore.record?.id,
  })

export const updateListView = (id: string, data: Partial<ListViewRecord>) =>
  pb.collection('list_views').update<ListViewRecord>(id, data)

export const deleteListView = (id: string) => pb.collection('list_views').delete(id)
