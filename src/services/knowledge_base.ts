import pb from '@/lib/pocketbase/client'

export interface KnowledgeBaseRecord {
  id: string
  title: string
  content: string
  category?: string
  author?: string
  created: string
  updated: string
  expand?: {
    category?: { id: string; name: string }
    author?: { id: string; name: string; email: string }
  }
}

export const getArticles = (filter = '') =>
  pb
    .collection('knowledge_base')
    .getFullList<KnowledgeBaseRecord>({ filter, sort: '-created', expand: 'category,author' })

export const getArticle = (id: string) =>
  pb.collection('knowledge_base').getOne<KnowledgeBaseRecord>(id, { expand: 'category,author' })

export const createArticle = (data: Partial<KnowledgeBaseRecord>) =>
  pb
    .collection('knowledge_base')
    .create<KnowledgeBaseRecord>({ ...data, author: pb.authStore.record?.id })

export const updateArticle = (id: string, data: Partial<KnowledgeBaseRecord>) =>
  pb.collection('knowledge_base').update<KnowledgeBaseRecord>(id, data)

export const deleteArticle = (id: string) => pb.collection('knowledge_base').delete(id)
