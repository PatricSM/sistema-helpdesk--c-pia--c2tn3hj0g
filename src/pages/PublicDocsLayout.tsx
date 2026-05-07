import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { BookOpen, MessageCircleQuestion } from 'lucide-react'
import { getCategories, type CategoryRecord } from '@/services/categories'
import { AskQuestionDialog } from '@/components/AskQuestionDialog'
import { getArticles, type KnowledgeBaseRecord } from '@/services/knowledge_base'
import { cn } from '@/lib/utils'

export function PublicDocsLayout() {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [isAskQuestionOpen, setIsAskQuestionOpen] = useState(false)
  const [articles, setArticles] = useState<KnowledgeBaseRecord[]>([])

  useEffect(() => {
    Promise.all([getCategories(), getArticles()])
      .then(([cats, arts]) => {
        setCategories(cats)
        setArticles(arts)
      })
      .catch(console.error)
  }, [])

  const uncategorized = articles.filter((a) => !a.category)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 font-semibold">
          <BookOpen className="w-5 h-5 text-primary" />
          <span>Base de Conhecimento</span>
        </div>
        <Button size="sm" onClick={() => setIsAskQuestionOpen(true)}>
          <MessageCircleQuestion className="w-4 h-4 mr-2" />
          Ainda Tenho Dúvida
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-3.5rem)]">
        <aside className="w-64 shrink-0 border-r border-border bg-muted/30 overflow-y-auto py-6 px-4 hidden md:block">
          {categories.map((cat) => {
            const catArticles = articles.filter((a) => a.category === cat.id)
            if (catArticles.length === 0) return null
            return (
              <div key={cat.id} className="mb-6">
                <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {cat.name}
                </h3>
                <nav className="space-y-1">
                  {catArticles.map((a) => (
                    <NavLink
                      key={a.id}
                      to={`/docs/${a.id}`}
                      className={({ isActive }) =>
                        cn(
                          'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )
                      }
                    >
                      <span className="truncate">{a.title}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            )
          })}

          {uncategorized.length > 0 && (
            <div className="mb-6">
              <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Geral
              </h3>
              <nav className="space-y-1">
                {uncategorized.map((a) => (
                  <NavLink
                    key={a.id}
                    to={`/docs/${a.id}`}
                    className={({ isActive }) =>
                      cn(
                        'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    <span className="truncate">{a.title}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto bg-background px-4 py-6 md:px-8 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <Outlet />
          </div>
        </main>
      </div>

      <AskQuestionDialog open={isAskQuestionOpen} onOpenChange={setIsAskQuestionOpen} />
    </div>
  )
}
