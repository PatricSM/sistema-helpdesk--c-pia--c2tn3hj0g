import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Calendar, ThumbsUp, ThumbsDown, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { Pill } from '@/components/Pill'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getArticle, KnowledgeBaseRecord } from '@/services/knowledge_base'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })

export default function ArticleDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const isAgentOrAdmin = user?.role === 'admin' || user?.role === 'agent'
  const isClient = user?.role === 'client'

  const [article, setArticle] = useState<KnowledgeBaseRecord | null>(null)
  const [feedback, setFeedback] = useState<boolean | null>(null)

  useEffect(() => {
    if (!id) return
    getArticle(id)
      .then(setArticle)
      .catch(() => {
        toast({ variant: 'destructive', title: 'Artigo não encontrado' })
        navigate(isClient ? '/kb-public' : '/knowledge-base')
      })
  }, [id, navigate, toast, isClient])

  if (!article) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Carregando…
      </div>
    )
  }

  const backTo = isClient ? '/kb-public' : '/knowledge-base'

  return (
    <>
      <PageHeader>
        <PageTitle
          title={article.title}
          icon={BookOpen}
          leftSlot={
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link to={backTo}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          }
          rightSlot={
            isAgentOrAdmin ? (
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5">
                <Link to={`/knowledge-base/${article.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Link>
              </Button>
            ) : null
          }
        />
      </PageHeader>

      <article className="max-w-3xl mx-auto w-full px-5 py-8">
        <div className="space-y-3 mb-6">
          {article.expand?.category && <Pill color="violet" label={article.expand.category.name} />}
          <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {article.expand?.author && <span>Por {article.expand.author.name}</span>}
            <span>·</span>
            <Calendar className="h-3.5 w-3.5" />
            <span>Atualizado em {formatDate(article.updated)}</span>
          </div>
        </div>

        <div
          className="prose prose-slate max-w-none text-sm leading-relaxed pt-4 pb-8 border-b"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <div className="flex items-center justify-between pt-6">
          <span className="text-sm font-medium text-gray-700">Este artigo foi útil?</span>
          <div className="flex gap-2">
            <Button
              variant={feedback === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFeedback(true)
                toast({ title: 'Obrigado pelo feedback!' })
              }}
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> Sim
            </Button>
            <Button
              variant={feedback === false ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => {
                setFeedback(false)
                toast({ title: 'Vamos melhorar este artigo.' })
              }}
            >
              <ThumbsDown className="mr-2 h-4 w-4" /> Não
            </Button>
          </div>
        </div>
      </article>
    </>
  )
}
