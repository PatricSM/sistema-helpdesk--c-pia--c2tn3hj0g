import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon, Ticket, BookOpen, Building2, Contact2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { EmptyState } from '@/components/EmptyState'
import { Pill } from '@/components/Pill'
import { getTickets, TicketRecord } from '@/services/tickets'
import { getArticles, KnowledgeBaseRecord } from '@/services/knowledge_base'
import { getCustomers, CustomerRecord } from '@/services/customers'
import { getContacts, ContactRecord } from '@/services/contacts'

export default function Search() {
  const [q, setQ] = useState('')
  const [tickets, setTickets] = useState<TicketRecord[]>([])
  const [articles, setArticles] = useState<KnowledgeBaseRecord[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [contacts, setContacts] = useState<ContactRecord[]>([])

  useEffect(() => {
    Promise.all([getTickets(), getArticles(), getCustomers(), getContacts()])
      .then(([t, a, cu, co]) => {
        setTickets(t)
        setArticles(a)
        setCustomers(cu)
        setContacts(co)
      })
      .catch(() => {})
  }, [])

  const lc = q.toLowerCase()
  const hasQuery = q.trim().length > 0
  const matchTickets = hasQuery
    ? tickets
        .filter(
          (t) =>
            t.title.toLowerCase().includes(lc) || (t.description || '').toLowerCase().includes(lc),
        )
        .slice(0, 8)
    : []
  const matchArticles = hasQuery
    ? articles
        .filter(
          (a) => a.title.toLowerCase().includes(lc) || (a.content || '').toLowerCase().includes(lc),
        )
        .slice(0, 8)
    : []
  const matchCustomers = hasQuery
    ? customers.filter((c) => c.name.toLowerCase().includes(lc)).slice(0, 6)
    : []
  const matchContacts = hasQuery
    ? contacts
        .filter(
          (c) => c.name.toLowerCase().includes(lc) || (c.email || '').toLowerCase().includes(lc),
        )
        .slice(0, 6)
    : []

  const total =
    matchTickets.length + matchArticles.length + matchCustomers.length + matchContacts.length

  return (
    <>
      <PageHeader>
        <PageTitle title="Busca" icon={SearchIcon} />
      </PageHeader>

      <div className="max-w-3xl mx-auto w-full px-5 py-6">
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            autoFocus
            placeholder="Pergunte algo, busque chamados, artigos, clientes..."
            className="pl-10 h-12 text-base shadow-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {!hasQuery && (
          <EmptyState
            icon={SearchIcon}
            title="Faça uma busca"
            description="Digite acima para buscar em chamados, artigos, clientes e contatos."
          />
        )}

        {hasQuery && total === 0 && (
          <EmptyState
            icon={SearchIcon}
            title="Sem resultados"
            description={`Nenhum resultado para "${q}".`}
          />
        )}

        {hasQuery && total > 0 && (
          <div className="space-y-6">
            <ResultGroup label="Chamados" icon={Ticket} count={matchTickets.length}>
              {matchTickets.map((t) => (
                <Link
                  key={t.id}
                  to={`/tickets/${t.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b last:border-0"
                >
                  <Pill bullet color="red" label={t.status} />
                  <span className="flex-1 text-sm font-medium truncate">{t.title}</span>
                  <span className="text-xs text-gray-500">#{t.id.slice(-6)}</span>
                </Link>
              ))}
            </ResultGroup>

            <ResultGroup label="Artigos" icon={BookOpen} count={matchArticles.length}>
              {matchArticles.map((a) => (
                <Link
                  key={a.id}
                  to={`/knowledge-base/${a.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b last:border-0"
                >
                  <BookOpen className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    {a.expand?.category && (
                      <p className="text-xs text-gray-500">{a.expand.category.name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </ResultGroup>

            <ResultGroup label="Clientes" icon={Building2} count={matchCustomers.length}>
              {matchCustomers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0"
                >
                  <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium">{c.name}</span>
                </div>
              ))}
            </ResultGroup>

            <ResultGroup label="Contatos" icon={Contact2} count={matchContacts.length}>
              {matchContacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0"
                >
                  <Contact2 className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                  </div>
                </div>
              ))}
            </ResultGroup>
          </div>
        )}
      </div>
    </>
  )
}

function ResultGroup({
  label,
  icon: Icon,
  count,
  children,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  count: number
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-gray-500">({count})</span>
      </div>
      <Card>
        <CardContent className="p-0">{children}</CardContent>
      </Card>
    </div>
  )
}
