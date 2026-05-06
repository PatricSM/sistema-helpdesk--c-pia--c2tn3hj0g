import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash, Copy, MessageSquareQuote } from 'lucide-react'
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
import { Pill } from '@/components/Pill'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import {
  getCannedResponses,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
  CannedResponseRecord,
} from '@/services/canned_responses'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

function ResponseDialog({
  response,
  children,
}: {
  response?: CannedResponseRecord
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [shortcut, setShortcut] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setTitle(response?.title || '')
      setShortcut(response?.shortcut || '')
      setBody(response?.body || '')
      setErrors({})
    }
  }, [open, response])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      if (response) {
        await updateCannedResponse(response.id, { title, shortcut: shortcut || undefined, body })
        toast({ title: 'Resposta atualizada!' })
      } else {
        await createCannedResponse({ title, shortcut: shortcut || undefined, body })
        toast({ title: 'Resposta criada!' })
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
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{response ? 'Editar resposta' : 'Nova resposta pronta'}</DialogTitle>
            <DialogDescription>
              Modelos reutilizáveis para responder rapidamente nos chamados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Saudação inicial"
                required
              />
              {errors.title && <span className="text-xs text-destructive">{errors.title}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shortcut">Atalho</Label>
              <Input
                id="shortcut"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="/oi"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Mensagem *</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Texto que será inserido no comentário..."
                rows={6}
                className="resize-none"
                required
              />
              {errors.body && <span className="text-xs text-destructive">{errors.body}</span>}
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

export default function CannedResponses() {
  const { user } = useAuth()
  const isAgentOrAdmin = user?.role === 'admin' || user?.role === 'agent'

  const [responses, setResponses] = useState<CannedResponseRecord[]>([])
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const load = async () => {
    try {
      setResponses(await getCannedResponses())
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('canned_responses', load)

  if (!isAgentOrAdmin) return <Navigate to="/" replace />

  const filtered = responses.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      (r.shortcut || '').toLowerCase().includes(q) ||
      r.body.toLowerCase().includes(q)
    )
  })

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: 'Copiado!' })
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível copiar' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCannedResponse(id)
      toast({ title: 'Resposta removida!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao remover',
        description: getErrorMessage(err),
      })
    }
  }

  const columns: ListColumn<CannedResponseRecord>[] = [
    {
      key: 'title',
      label: 'Título',
      render: (r) => <span className="font-medium text-gray-900">{r.title}</span>,
    },
    {
      key: 'shortcut',
      label: 'Atalho',
      width: '120px',
      render: (r) =>
        r.shortcut ? (
          <Pill color="gray" label={r.shortcut} className="font-mono" />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'body',
      label: 'Mensagem',
      render: (r) => (
        <span className="text-sm text-gray-600 truncate block max-w-md">
          {r.body.replace(/\n/g, ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '120px',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => copy(r.body)}
            title="Copiar"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <ResponseDialog response={r}>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </ResponseDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                title="Excluir"
              >
                <Trash className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(r.id)}>Excluir</AlertDialogAction>
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
          title="Respostas Prontas"
          icon={MessageSquareQuote}
          rightSlot={<ResponseDialog />}
        />
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
              icon={MessageSquareQuote}
              title="Nenhuma resposta pronta"
              description="Crie modelos reutilizáveis para responder rapidamente nos chamados."
              action={<ResponseDialog />}
            />
          }
        />
      </div>
    </>
  )
}
