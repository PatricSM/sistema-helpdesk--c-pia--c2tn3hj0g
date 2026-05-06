import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SettingsLayoutBase } from '@/components/SettingsLayoutBase'
import { ListView, ListColumn } from '@/components/ListView'
import { Pill } from '@/components/Pill'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getSlaPolicies,
  createSlaPolicy,
  updateSlaPolicy,
  deleteSlaPolicy,
  SlaPolicyRecord,
  SlaPriority,
} from '@/services/sla-policies'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

const PRIORITY_LABEL: Record<SlaPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}
const PRIORITY_COLOR: Record<SlaPriority, string> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
}

const formatMinutes = (mins?: number) => {
  if (!mins) return '—'
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function SlaDialog({ policy, children }: { policy?: SlaPolicyRecord; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<SlaPriority>('medium')
  const [responseMin, setResponseMin] = useState<number>(60)
  const [resolutionMin, setResolutionMin] = useState<number>(480)
  const [businessHours, setBusinessHours] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(policy?.name || '')
      setDescription(policy?.description || '')
      setPriority(policy?.priority || 'medium')
      setResponseMin(policy?.response_time_min ?? 60)
      setResolutionMin(policy?.resolution_time_min ?? 480)
      setBusinessHours(policy?.business_hours_only ?? true)
      setIsActive(policy?.is_active ?? true)
      setErrors({})
    }
  }, [open, policy])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      const payload = {
        name,
        description: description || undefined,
        priority,
        response_time_min: responseMin,
        resolution_time_min: resolutionMin,
        business_hours_only: businessHours,
        is_active: isActive,
      }
      if (policy) {
        await updateSlaPolicy(policy.id, payload)
        toast({ title: 'Política atualizada!' })
      } else {
        await createSlaPolicy(payload)
        toast({ title: 'Política criada!' })
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
          <Button className="gap-1.5" size="sm">
            <Plus className="h-4 w-4" /> Nova política
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{policy ? 'Editar SLA' : 'Nova política de SLA'}</DialogTitle>
            <DialogDescription>
              Define metas de tempo de resposta e resolução por prioridade.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Standard SLA"
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
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="grid gap-2">
              <Label>Prioridade alvo</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as SlaPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABEL) as SlaPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="response">Resposta (min)</Label>
                <Input
                  id="response"
                  type="number"
                  value={responseMin}
                  onChange={(e) => setResponseMin(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resolution">Resolução (min)</Label>
                <Input
                  id="resolution"
                  type="number"
                  value={resolutionMin}
                  onChange={(e) => setResolutionMin(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Apenas horário comercial</p>
                  <p className="text-xs text-gray-500">
                    Contar tempo apenas em dias úteis e horário definido.
                  </p>
                </div>
                <Switch checked={businessHours} onCheckedChange={setBusinessHours} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Ativa</p>
                  <p className="text-xs text-gray-500">Aplicar essa política aos novos chamados.</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
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

export function SettingsSLA() {
  const [policies, setPolicies] = useState<SlaPolicyRecord[]>([])
  const { toast } = useToast()

  const load = async () => {
    try {
      setPolicies(await getSlaPolicies())
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('sla_policies', load)

  const handleDelete = async (id: string) => {
    try {
      await deleteSlaPolicy(id)
      toast({ title: 'Política removida!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao remover',
        description: getErrorMessage(err),
      })
    }
  }

  const columns: ListColumn<SlaPolicyRecord>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-medium">{p.name}</span>
          {p.description && <span className="text-xs text-gray-500 truncate">{p.description}</span>}
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Prioridade',
      width: '140px',
      render: (p) =>
        p.priority ? (
          <Pill color={PRIORITY_COLOR[p.priority]} label={PRIORITY_LABEL[p.priority]} />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'response_time_min',
      label: 'Resposta',
      width: '120px',
      render: (p) => <span className="text-sm">{formatMinutes(p.response_time_min)}</span>,
    },
    {
      key: 'resolution_time_min',
      label: 'Resolução',
      width: '120px',
      render: (p) => <span className="text-sm">{formatMinutes(p.resolution_time_min)}</span>,
    },
    {
      key: 'is_active',
      label: 'Status',
      width: '100px',
      render: (p) =>
        p.is_active ? (
          <Pill color="green" label="Ativa" bullet />
        ) : (
          <Pill color="gray" label="Inativa" />
        ),
    },
    {
      key: 'actions',
      label: '',
      width: '90px',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <SlaDialog policy={p}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </SlaDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                <Trash className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir política?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(p.id)}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  return (
    <SettingsLayoutBase
      title="Políticas de SLA"
      description="Defina metas de tempo de resposta e resolução por prioridade."
      headerActions={<SlaDialog />}
    >
      {policies.length > 0 ? (
        <ListView columns={columns} rows={policies} />
      ) : (
        <EmptyState
          icon={Timer}
          title="Nenhuma política de SLA"
          description="Crie políticas para garantir tempos de atendimento."
          action={<SlaDialog />}
        />
      )}
    </SettingsLayoutBase>
  )
}
