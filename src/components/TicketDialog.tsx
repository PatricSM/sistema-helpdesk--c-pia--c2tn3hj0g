import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { createTicket, updateTicket } from '@/services/tickets'
import { CategoryRecord } from '@/services/categories'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
type TicketType = 'question' | 'incident' | 'bug' | 'unspecified'

interface TicketLike {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type?: TicketType
  category?: string
  requester?: string
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'closed', label: 'Fechado' },
]

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export function TicketDialog({
  ticket,
  categories,
  children,
  onCreated,
}: {
  ticket?: TicketLike
  categories: CategoryRecord[]
  children?: React.ReactNode
  onCreated?: (id: string) => void
}) {
  const { user } = useAuth()
  const isAgentOrAdmin = user?.role === 'admin' || user?.role === 'agent'
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TicketStatus>('open')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [category, setCategory] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      if (ticket) {
        setTitle(ticket.title)
        setDescription(ticket.description)
        setStatus(ticket.status)
        setPriority(ticket.priority)
        setCategory(ticket.category || '')
      } else {
        setTitle('')
        setDescription('')
        setStatus('open')
        setPriority('medium')
        setCategory(categories[0]?.id || '')
      }
      setErrors({})
    }
  }, [open, ticket, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const payload: Record<string, unknown> = {
      title,
      description,
      priority,
      category: category || undefined,
    }
    if (isAgentOrAdmin) payload.status = status
    try {
      if (ticket) {
        await updateTicket(ticket.id, payload)
        toast({ title: 'Chamado atualizado!' })
      } else {
        const rec = await createTicket({
          ...payload,
          status: 'open',
          requester: user?.id,
        })
        toast({ title: 'Chamado aberto!' })
        onCreated?.(rec.id)
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Novo Chamado
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{ticket ? 'Editar Chamado' : 'Abrir Novo Chamado'}</DialogTitle>
            <DialogDescription>
              {ticket
                ? 'Atualize os detalhes do chamado.'
                : 'Preencha os dados para registrar um novo chamado.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resumo do problema"
                required
              />
              {errors.title && <span className="text-xs text-destructive">{errors.title}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o problema em detalhes..."
                rows={4}
                className="resize-none"
                required
              />
              {errors.description && (
                <span className="text-xs text-destructive">{errors.description}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {isAgentOrAdmin && (
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <span className="text-xs text-destructive">{errors.category}</span>
              )}
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
