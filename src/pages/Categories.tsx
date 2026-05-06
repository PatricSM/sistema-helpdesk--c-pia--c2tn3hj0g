import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash, Tag } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { ListView, ListColumn } from '@/components/ListView'
import { ListToolbar } from '@/components/ListToolbar'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryRecord,
} from '@/services/categories'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

const PRESET_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280']

function CategoryDialog({
  category,
  children,
}: {
  category?: CategoryRecord
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(category?.name || '')
      setDescription(category?.description || '')
      setColor(category?.color || PRESET_COLORS[0])
      setErrors({})
    }
  }, [open, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      if (category) {
        await updateCategory(category.id, { name, description, color })
        toast({ title: 'Categoria atualizada!' })
      } else {
        await createCategory({ name, description, color })
        toast({ title: 'Categoria criada!' })
      }
      setOpen(false)
    } catch (err) {
      const f = extractFieldErrors(err)
      if (Object.keys(f).length > 0) setErrors(f)
      else
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: getErrorMessage(err),
        })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white" size="sm">
            <Plus className="h-4 w-4" /> Create
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{category ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
            <DialogDescription>
              Categorias são compartilhadas entre chamados e base de conhecimento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Suporte Técnico"
                required
              />
              {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Para que serve essa categoria..."
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function Categories() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState<CategoryRecord[]>([])
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const load = async () => {
    try {
      setItems(await getCategories())
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('categories', load)

  if (!isAdmin) return <Navigate to="/" replace />

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id)
      toast({ title: 'Categoria removida!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao remover',
        description: getErrorMessage(err),
      })
    }
  }

  const filtered = items.filter((c) =>
    !search ? true : c.name.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: ListColumn<CategoryRecord>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: c.color || '#6b7280' }}
          />
          <span className="font-medium text-gray-900">{c.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Descrição',
      render: (c) => <span className="text-sm text-gray-600 truncate">{c.description || '—'}</span>,
    },
    {
      key: 'actions',
      label: '',
      width: '90px',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <CategoryDialog category={c}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </CategoryDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                <Trash className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                <AlertDialogDescription>
                  Chamados e artigos vinculados podem ficar sem categoria.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(c.id)}>Excluir</AlertDialogAction>
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
        <PageTitle title="Categorias" icon={Tag} rightSlot={<CategoryDialog />} />
      </PageHeader>

      <ListToolbar
        leftSlot={
          <Input
            placeholder="Buscar..."
            className="h-8 w-60 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
        rowCount={filtered.length}
      />

      <div className="px-0">
        <ListView
          columns={columns}
          rows={filtered}
          emptyState={
            <EmptyState
              icon={Tag}
              title="Nenhuma categoria"
              description="Crie categorias para organizar chamados e artigos."
              action={<CategoryDialog />}
            />
          }
        />
      </div>
    </>
  )
}
