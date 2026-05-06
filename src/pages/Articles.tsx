import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { EmptyState } from '@/components/EmptyState'
import { Pill } from '@/components/Pill'
import { getArticles, KnowledgeBaseRecord } from '@/services/knowledge_base'
import pb from '@/lib/pocketbase/client'

interface CategoryShort {
  id: string
  name: string
  color?: string
  description?: string
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function Articles() {
  const { categoryId = '' } = useParams()
  const [category, setCategory] = useState<CategoryShort | null>(null)
  const [articles, setArticles] = useState<KnowledgeBaseRecord[]>([])

  useEffect(() => {
    pb.collection('categories')
      .getOne<CategoryShort>(categoryId)
      .then(setCategory)
      .catch(() => {})
    getArticles(`category="${categoryId}"`)
      .then(setArticles)
      .catch(() => {})
  }, [categoryId])

  return (
    <>
      <PageHeader>
        <PageTitle
          title={category?.name || 'Categoria'}
          icon={BookOpen}
          leftSlot={
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link to="/kb-public">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </PageHeader>

      <div className="max-w-3xl mx-auto w-full px-5 py-8 space-y-3">
        {category?.description && (
          <p className="text-sm text-gray-600 mb-4">{category.description}</p>
        )}
        {articles.length > 0 ? (
          articles.map((a) => (
            <Link key={a.id} to={`/kb-public/articles/${a.id}`}>
              <Card className="hover:shadow-md transition-all hover:border-gray-300">
                <CardContent className="p-4 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900">{a.title}</h3>
                    {a.content && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {a.content.slice(0, 160)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {a.expand?.author && (
                        <span className="text-xs text-gray-500">por {a.expand.author.name}</span>
                      )}
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{formatDate(a.updated)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <EmptyState
            icon={FileText}
            title="Sem artigos nesta categoria"
            description="Volte e explore outras categorias."
          />
        )}
      </div>
    </>
  )
}
