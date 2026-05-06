import { useEffect, useState } from 'react'
import { ChevronDown, Save, Trash, Globe, User as UserIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { getListViews, createListView, deleteListView, ListViewRecord } from '@/services/list-views'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface ListViewsDropdownProps {
  collectionName: string
  currentFilters: Record<string, string>
  currentSortKey?: string
  currentSortDir?: 'asc' | 'desc'
  currentColumnsHidden?: string[]
  onApply: (view: ListViewRecord) => void
}

export function ListViewsDropdown({
  collectionName,
  currentFilters,
  currentSortKey,
  currentSortDir,
  currentColumnsHidden,
  onApply,
}: ListViewsDropdownProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [views, setViews] = useState<ListViewRecord[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showSave, setShowSave] = useState(false)
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  const load = async () => {
    try {
      setViews(await getListViews(collectionName))
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [collectionName])

  useRealtime('list_views', load)

  const myViews = views.filter((v) => v.owner === user?.id)
  const publicViews = views.filter((v) => v.is_public && v.owner !== user?.id)
  const activeView = views.find((v) => v.id === activeId)

  const handleSave = async () => {
    try {
      const created = await createListView({
        name,
        collection_name: collectionName,
        filters: currentFilters,
        sort_key: currentSortKey,
        sort_dir: currentSortDir,
        columns_hidden: currentColumnsHidden,
        is_public: isPublic,
      })
      toast({ title: 'Visão salva!' })
      setActiveId(created.id)
      setName('')
      setIsPublic(false)
      setShowSave(false)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: getErrorMessage(err),
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteListView(id)
      toast({ title: 'Visão removida!' })
      if (activeId === id) setActiveId(null)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao remover',
        description: getErrorMessage(err),
      })
    }
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-gray-700">
            {activeView?.name || 'Todas as visões'}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1">
          <div className="px-2 py-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Padrão
          </div>
          <button
            type="button"
            className={cn(
              'flex h-7 w-full items-center gap-2 rounded px-2 text-sm hover:bg-gray-50',
              !activeId && 'bg-gray-100 font-medium',
            )}
            onClick={() => setActiveId(null)}
          >
            {!activeId && <Check className="h-3.5 w-3.5" />}
            <span className={cn(!activeId ? 'flex-1' : 'flex-1 ml-5')}>Todas</span>
          </button>

          {myViews.length > 0 && (
            <>
              <div className="px-2 py-1.5 mt-1 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Minhas visões
              </div>
              {myViews.map((v) => (
                <ViewItem
                  key={v.id}
                  view={v}
                  active={v.id === activeId}
                  onApply={() => {
                    onApply(v)
                    setActiveId(v.id)
                  }}
                  onDelete={() => handleDelete(v.id)}
                  ownerLabel={null}
                />
              ))}
            </>
          )}

          {publicViews.length > 0 && (
            <>
              <div className="px-2 py-1.5 mt-1 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Públicas
              </div>
              {publicViews.map((v) => (
                <ViewItem
                  key={v.id}
                  view={v}
                  active={v.id === activeId}
                  onApply={() => {
                    onApply(v)
                    setActiveId(v.id)
                  }}
                  onDelete={null}
                  ownerLabel={<Globe className="h-3 w-3 text-gray-400" />}
                />
              ))}
            </>
          )}

          <div className="border-t my-1" />
          <button
            type="button"
            className="flex h-7 w-full items-center gap-2 rounded px-2 text-sm hover:bg-gray-50 text-gray-700"
            onClick={() => setShowSave(true)}
          >
            <Save className="h-3.5 w-3.5" />
            Salvar visão atual
          </button>
        </PopoverContent>
      </Popover>

      <Dialog open={showSave} onOpenChange={setShowSave}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Salvar visão</DialogTitle>
            <DialogDescription>
              Filtros, ordenação e colunas ocultas serão guardados nesta visão.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="view-name">Nome *</Label>
              <Input
                id="view-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Meus tickets urgentes"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Compartilhar com a equipe</p>
                <p className="text-xs text-gray-500">
                  Visões públicas aparecem para todos os agentes.
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSave(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ViewItem({
  view,
  active,
  onApply,
  onDelete,
  ownerLabel,
}: {
  view: ListViewRecord
  active: boolean
  onApply: () => void
  onDelete: (() => void) | null
  ownerLabel: React.ReactNode
}) {
  return (
    <div className={cn('flex items-center gap-1 rounded group', active && 'bg-gray-100')}>
      <button
        type="button"
        className="flex h-7 flex-1 items-center gap-2 px-2 text-sm hover:bg-gray-50 rounded text-left"
        onClick={onApply}
      >
        {active ? (
          <Check className="h-3.5 w-3.5 shrink-0" />
        ) : ownerLabel ? (
          <span className="shrink-0">{ownerLabel}</span>
        ) : (
          <UserIcon className="h-3 w-3 text-gray-400 shrink-0" />
        )}
        <span className={cn('flex-1 truncate', active && 'font-medium')}>{view.name}</span>
      </button>
      {onDelete && (
        <button
          type="button"
          className="h-7 w-7 inline-flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
