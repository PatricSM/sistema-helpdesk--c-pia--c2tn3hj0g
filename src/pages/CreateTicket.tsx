import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { createTicket, TicketPriority } from '@/services/tickets'
import { getCategories, CategoryRecord } from '@/services/categories'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export default function CreateTicket() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [category, setCategory] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCategories()
      .then((cats) => {
        setCategories(cats)
        if (cats[0]) setCategory(cats[0].id)
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      const rec = await createTicket({
        title,
        description,
        status: 'open',
        priority,
        category: category || undefined,
        requester: user?.id,
      })
      toast({ title: 'Chamado aberto!' })
      navigate(`/tickets/${rec.id}`)
    } catch (err) {
      const f = extractFieldErrors(err)
      if (Object.keys(f).length > 0) setErrors(f)
      else
        toast({
          variant: 'destructive',
          title: 'Erro ao criar chamado',
          description: getErrorMessage(err),
        })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/tickets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Chamado</h1>
          <p className="text-xs text-muted-foreground">Abra um novo chamado de suporte</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                rows={6}
                className="resize-none"
                required
              />
              {errors.description && (
                <span className="text-xs text-destructive">{errors.description}</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
              <div className="grid gap-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                  <SelectTrigger>
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
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Abrindo…' : 'Abrir Chamado'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
