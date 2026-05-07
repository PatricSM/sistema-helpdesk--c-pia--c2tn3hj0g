import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getArticle, type KnowledgeBaseRecord } from '@/services/knowledge_base'
import { Skeleton } from '@/components/ui/skeleton'

export function PublicDocsArticle() {
  const { articleId } = useParams()
  const [article, setArticle] = useState<KnowledgeBaseRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!articleId) return
    setLoading(true)
    getArticle(articleId)
      .then(setArticle)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [articleId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-[200px] w-full mt-8" />
        <Skeleton className="h-[200px] w-full mt-4" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="text-center pt-20">
        <h2 className="text-2xl font-semibold">Artigo não encontrado</h2>
        <p className="text-muted-foreground mt-2">
          O artigo que você procura pode ter sido removido.
        </p>
      </div>
    )
  }

  return (
    <article className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-8 pb-6 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          {article.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {article.expand?.category && (
            <span className="font-medium text-primary">{article.expand.category.name}</span>
          )}
          <span>Atualizado em {new Date(article.updated).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      <div
        className="prose prose-slate dark:prose-invert prose-sm md:prose-base max-w-none whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  )
}
