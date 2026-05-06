import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Search, Folder, FileText, ArrowRight, Pencil, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { Pill } from '@/components/Pill'
import { ListView, ListColumn } from '@/components/ListView'
import { ListToolbar, FilterDef } from '@/components/ListToolbar'
import { EmptyState } from '@/components/EmptyState'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { getArticles, deleteArticle, KnowledgeBaseRecord } from '@/services/knowledge_base'
import { getCategories, CategoryRecord } from '@/services/categories'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function KnowledgeBase() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const isAgentOrAdmin = user?.role === 'admin' || user?.role === 'agent'
  const isClient = user?.role === 'client'

  const [articles, setArticles] = useState<KnowledgeBaseRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'categories' | 'articles'>('categories')

  const load = async () => {
    try {
      const [arts, cats] = await Promise.all([getArticles(), getCategories()])
      setArticles(arts)
      setCategories(cats)
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('knowledge_base', load)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return articles.filter((a) => {
      const matchesSearch =
        !q || a.title.toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q)
      const matchesCategory =
        !filterValues.category ||
        filterValues.category === 'all' ||
        a.category === filterValues.category
      return matchesSearch && matchesCategory
    })
  }, [articles, search, filterValues])

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of articles) {
      const k = a.category || '__none__'
      map[k] = (map[k] || 0) + 1
    }
    return map
  }, [articles])

  if (isClient) {
    return <CustomerKBView articles={articles} categories={categories} />
  }

  const filters: FilterDef[] = [
    {
      key: 'category',
      label: 'Categoria',
      options: categories.map((c) => ({ value: c.id, label: c.name })),
    },
  ]

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id)
      toast({ title: 'Artigo excluído!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao excluir',
        description: getErrorMessage(err),
      })
    }
  }

  const columns: ListColumn<KnowledgeBaseRecord>[] = [
    {
      key: 'title',
      label: 'Título',
      render: (a) => <span className="font-medium text-gray-900 truncate">{a.title}</span>,
    },
    {
      key: 'category',
      label: 'Categoria',
      width: '180px',
      render: (a) =>
        a.expand?.category ? (
          <Pill color="violet" label={a.expand.category.name} variant="subtle" />
        ) : (
          <span className="text-xs text-gray-400 italic">Sem categoria</span>
        ),
    },
    {
      key: 'author',
      label: 'Autor',
      width: '160px',
      render: (a) =>
        a.expand?.author ? (
          <span className="text-sm text-gray-700">{a.expand.author.name}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'updated',
      label: 'Atualizado',
      width: '120px',
      render: (a) => <span className="text-xs text-gray-500">{formatDate(a.updated)}</span>,
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
            <Link to={`/knowledge-base/${a.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                <Trash className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(a.id)}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader>
        <PageTitle
          title="Base de Conhecimento"
          icon={BookOpen}
          rightSlot={
            isAgentOrAdmin ? (
              <Button
                asChild
                className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white"
                size="sm"
              >
                <Link to="/knowledge-base/new">
                  <Plus className="h-4 w-4" /> Create
                </Link>
              </Button>
            ) : null
          }
        />
      </PageHeader>

      <div className="px-5 py-2 border-b">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar artigos..."
            className="pl-9 h-9 bg-gray-50 border-gray-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as 'categories' | 'articles')}
        className="flex flex-col flex-1"
      >
        <TabsList className="rounded-none border-b bg-transparent h-10 px-5 justify-start gap-4">
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none px-0 h-10"
          >
            <Folder className="h-3.5 w-3.5 mr-1.5" /> Categorias
          </TabsTrigger>
          <TabsTrigger
            value="articles"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none px-0 h-10"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Artigos ({filtered.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="p-5 m-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((c) => (
              <CategoryFolder
                key={c.id}
                category={c}
                count={categoryCounts[c.id] || 0}
                onClick={() => {
                  setFilterValues({ category: c.id })
                  setTab('articles')
                }}
              />
            ))}
            {categories.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={Folder}
                  title="Nenhuma categoria"
                  description="Crie categorias para organizar seus artigos."
                  action={
                    isAgentOrAdmin ? (
                      <Button asChild size="sm">
                        <Link to="/categories">
                          <Plus className="h-4 w-4 mr-1.5" /> Nova categoria
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="articles" className="m-0 flex-1 flex flex-col">
          <ListToolbar
            filters={filters}
            filterValues={filterValues}
            onFilterChange={(k, v) => setFilterValues({ ...filterValues, [k]: v })}
            rowCount={filtered.length}
          />
          <div className="px-0 flex-1">
            <ListView
              columns={columns}
              rows={filtered}
              onRowClick={(row) => navigate(`/knowledge-base/${row.id}`)}
              emptyState={
                <EmptyState
                  icon={FileText}
                  title="Nenhum artigo"
                  description="Crie o primeiro artigo da sua base de conhecimento."
                  action={
                    isAgentOrAdmin ? (
                      <Button asChild size="sm">
                        <Link to="/knowledge-base/new">
                          <Plus className="h-4 w-4 mr-1.5" /> Novo artigo
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

function CategoryFolder({
  category,
  count,
  onClick,
}: {
  category: { id: string; name: string; color?: string }
  count: number
  onClick: () => void
}) {
  return (
    <Card
      className="border-gray-200 shadow-none hover:border-gray-300 cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Folder
            className="h-5 w-5"
            style={{ color: category.color || '#6b7280' }}
            strokeWidth={1.5}
          />
          <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-700 transition-colors" />
        </div>
        <h3 className="font-medium text-sm text-gray-900 truncate">{category.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {count} {count === 1 ? 'artigo' : 'artigos'}
        </p>
      </CardContent>
    </Card>
  )
}

function CustomerKBView({
  articles,
  categories,
}: {
  articles: KnowledgeBaseRecord[]
  categories: CategoryRecord[]
}) {
  const [search, setSearch] = useState('')

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of articles)
      map[a.category || '__none__'] = (map[a.category || '__none__'] || 0) + 1
    return map
  }, [articles])

  const filtered = useMemo(() => {
    if (!search) return []
    const q = search.toLowerCase()
    return articles
      .filter(
        (a) => a.title.toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [articles, search])

  return (
    <>
      <PageHeader>
        <PageTitle title="Base de Conhecimento" icon={BookOpen} />
      </PageHeader>
      <div className="max-w-4xl mx-auto w-full px-5 py-10">
        <div className="text-center mb-8 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Como podemos ajudar?</h1>
          <p className="text-gray-600">Pesquise nas categorias ou faça uma pergunta.</p>
        </div>

        <div className="relative max-w-2xl mx-auto mb-10">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            className="pl-10 h-12 text-base shadow-sm"
            placeholder="Pergunte algo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg overflow-hidden z-10">
              {filtered.map((a) => (
                <Link
                  key={a.id}
                  to={`/kb-public/articles/${a.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b last:border-0"
                >
                  <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    {a.expand?.category && (
                      <p className="text-xs text-gray-500">{a.expand.category.name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <h2 className="text-lg font-semibold mb-4">Categorias</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.id} to={`/kb-public/${c.id}`}>
              <CategoryFolder category={c} count={counts[c.id] || 0} onClick={() => {}} />
            </Link>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Folder}
                title="Sem categorias ainda"
                description="A base de conhecimento será preenchida em breve."
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
