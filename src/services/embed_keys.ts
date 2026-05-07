import pb from '@/lib/pocketbase/client'

export const getEmbedKeys = () =>
  pb.collection('embed_keys').getFullList({ expand: 'default_category,default_team' })
export const createEmbedKey = (data: any) => pb.collection('embed_keys').create(data)
export const updateEmbedKey = (id: string, data: any) =>
  pb.collection('embed_keys').update(id, data)
export const deleteEmbedKey = (id: string) => pb.collection('embed_keys').delete(id)
