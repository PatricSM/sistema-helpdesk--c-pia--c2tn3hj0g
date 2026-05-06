import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Ticket as TicketIcon, Download, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { TicketDialog } from '@/components/TicketDialog'
import { ListView, ListColumn } from '@/components/ListView'
import { ListToolbar, FilterDef } from '@/components/ListToolbar'
import { ListViewsDropdown } from '@/components/ListViewsDropdown'
import { ListSelectBanner } from '@/components/ListSelectBanner'
import { Pill } from '@/components/Pill'
import { EmptyState } from '@/components/EmptyState'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  getTickets,
  deleteTicket,
  TicketRecord,
  TicketStatus,
  TicketPriority,
  TicketType,
} from '@/services/tickets'
import { getCategories, CategoryRecord } from '@/services/categories'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}
const STATUS_COLOR: Record<TicketStatus, string> = {
  open: 'red',
  in_progress: 'amber',
  resolved: 'green',
  closed: 'gray',
}
const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}
const PRIORITY_COLOR: Record<TicketPriority, string> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
}
const TYPE_LABEL: Record<TicketType, string> = {
  question: 'Question',
  incident: 'Incident',
  bug: 'Bug',
  unspecified: 'Unspecified',
}

const formatRelative = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'hoje'
  if (days < 7) return `${days}d atrás`
  if (days < 30) return `${Math.floor(days / 7)}sem atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}

interface ColumnVis {
  [key: string]: boolean
}

export default function Tickets() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const isAgentOrAdmin = user?.role === 'admin' || user?.role === 'agent'
  const isAdmin = user?.role === 'admin'

  const [tickets, setTickets] = useState<TicketRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sortKey, setSortKey] = useState<string>('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [columnVis, setColumnVis] = useState<ColumnVis>({})

  const load = async () => {
    try {
      const [items, cats] = await Promise.all([getTickets(), getCategories()])
      setTickets(items)
      setCategories(cats)
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('tickets', load)

  const filters: FilterDef[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        options: (Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => ({
          value: s,
          label: STATUS_LABEL[s],
        })),
      },
      {
        key: 'priority',
        label: 'Prioridade',
        options: (Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => ({
          value: p,
          label: PRIORITY_LABEL[p],
        })),
      },
      {
        key: 'type',
        label: 'Type',
        options: (Object.keys(TYPE_LABEL) as TicketType[]).map((t) => ({
          value: t,
          label: TYPE_LABEL[t],
        })),
      },
      {
        key: 'category',
        label: 'Categoria',
        options: categories.map((c) => ({ value: c.id, label: c.name })),
      },
    ],
    [categories],
  )

  const filtered = useMemo(() => {
    let arr = tickets.filter((t) => {
      for (const key of Object.keys(filterValues)) {
        const v = filterValues[key]
        if (!v || v === 'all') continue
        if ((t as Record<string, unknown>)[key] !== v) return false
      }
      return true
    })
    arr = [...arr].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey] as string | undefined
      const bv = (b as Record<string, unknown>)[sortKey] as string | undefined
      if (!av && !bv) return 0
      if (!av) return 1
      if (!bv) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [tickets, filterValues, sortKey, sortDir])

  const columns: ListColumn<TicketRecord>[] = useMemo(() => {
    const cols: ListColumn<TicketRecord>[] = [
      {
        key: 'id',
        label: 'ID',
        width: '80px',
        render: (t) => <span className="text-gray-500 text-xs">#{t.id.slice(-6)}</span>,
        hidden: columnVis.id === false,
      },
      {
        key: 'title',
        label: 'Subject',
        render: (t) => <span className="font-medium text-gray-900 truncate">{t.title}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        width: '160px',
        render: (t) => (
          <Pill bullet color={STATUS_COLOR[t.status]} label={STATUS_LABEL[t.status]} />
        ),
        hidden: columnVis.status === false,
      },
      {
        key: 'priority',
        label: 'Priority',
        width: '120px',
        render: (t) => <span className="text-sm text-gray-700">{PRIORITY_LABEL[t.priority]}</span>,
        hidden: columnVis.priority === false,
      },
      {
        key: 'type',
        label: 'Type',
        width: '120px',
        render: (t) => (
          <span className="text-sm text-gray-700">
            {t.type ? TYPE_LABEL[t.type] : 'Unspecified'}
          </span>
        ),
        hidden: columnVis.type === false,
      },
      {
        key: 'first_response_at',
        label: 'First response',
        width: '140px',
        render: (t) => {
          if (t.first_response_at) {
            return <Pill variant="outline" color="green" label="Fulfilled" />
          }
          if (t.sla_response_due && new Date(t.sla_response_due).getTime() < Date.now()) {
            return <Pill variant="outline" color="red" label="Failed" />
          }
          return <span className="text-xs text-gray-500">{formatRelative(t.created)}</span>
        },
        hidden: columnVis.first_response_at === false,
      },
      {
        key: 'assignee',
        label: 'Assigned To',
        width: '180px',
        render: (t) =>
          t.expand?.assignee ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={`https://img.usecurling.com/ppl/thumbnail?seed=${t.expand.assignee.id}`}
                />
                <AvatarFallback className="text-[10px]">
                  {t.expand.assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700 truncate">{t.expand.assignee.name}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Não atribuído</span>
          ),
        hidden: columnVis.assignee === false,
      },
    ]
    return cols
  }, [columnVis])

  const handleColumnVisibility = (key: string, hidden: boolean) => {
    setColumnVis({ ...columnVis, [key]: !hidden })
  }

  const sortableColumns = [
    { key: 'created', label: 'Criado em' },
    { key: 'updated', label: 'Atualizado em' },
    { key: 'title', label: 'Subject' },
    { key: 'priority', label: 'Prioridade' },
    { key: 'status', label: 'Status' },
  ]

  const handleBulkDelete = async () => {
    for (const id of selected) {
      try {
        await deleteTicket(id)
      } catch {
        // continue
      }
    }
    toast({ title: `${selected.size} chamado(s) excluído(s)` })
    setSelected(new Set())
    load()
  }

  return (
    <>
      <PageHeader>
        <PageTitle
          title="Chamados"
          icon={TicketIcon}
          rightSlot={
            <TicketDialog categories={categories}>
              <Button className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white" size="sm">
                <Plus className="h-4 w-4" /> Create
              </Button>
            </TicketDialog>
          }
        />
      </PageHeader>

      <ListToolbar
        leftSlot={
          <ListViewsDropdown
            collectionName="tickets"
            currentFilters={filterValues}
            currentSortKey={sortKey}
            currentSortDir={sortDir}
            currentColumnsHidden={Object.keys(columnVis).filter((k) => columnVis[k] === false)}
            onApply={(view) => {
              setFilterValues((view.filters as Record<string, string>) || {})
              if (view.sort_key) setSortKey(view.sort_key)
              if (view.sort_dir) setSortDir(view.sort_dir)
              const cv: ColumnVis = {}
              for (const k of view.columns_hidden || []) cv[k] = false
              setColumnVis(cv)
            }}
          />
        }
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(k, v) => setFilterValues({ ...filterValues, [k]: v })}
        sortableColumns={sortableColumns}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={(k, d) => {
          setSortKey(k)
          setSortDir(d)
        }}
        columns={columns}
        onColumnVisibilityChange={handleColumnVisibility}
        rowCount={filtered.length}
      />

      <ListSelectBanner
        count={selected.size}
        onClear={() => setSelected(new Set())}
        actions={[
          {
            label: 'Exportar',
            icon: Download,
            onClick: () => {
              const csv =
                'ID,Subject,Status,Priority,Created\n' +
                filtered
                  .filter((t) => selected.has(t.id))
                  .map((t) => `${t.id},"${t.title}",${t.status},${t.priority},${t.created}`)
                  .join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'tickets.csv'
              a.click()
            },
          },
          ...(isAdmin
            ? [
                {
                  label: 'Excluir',
                  icon: Trash,
                  variant: 'destructive' as const,
                  onClick: handleBulkDelete,
                },
              ]
            : []),
        ]}
      />

      <div className="px-0">
        <ListView
          columns={columns}
          rows={filtered}
          selectable={isAgentOrAdmin}
          selected={selected}
          onSelectedChange={setSelected}
          onRowClick={(row) => navigate(`/tickets/${row.id}`)}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={(key) => {
            if (key === sortKey) {
              setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
            } else {
              setSortKey(key)
              setSortDir('desc')
            }
          }}
          emptyState={
            <EmptyState
              icon={TicketIcon}
              title="Nenhum chamado"
              description="Quando houver chamados, eles aparecerão aqui."
              action={
                <TicketDialog categories={categories}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" /> Criar chamado
                  </Button>
                </TicketDialog>
              }
            />
          }
        />
      </div>
    </>
  )
}
