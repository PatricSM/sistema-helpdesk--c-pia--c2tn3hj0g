import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash, GitFork, ArrowDown, ArrowUp } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { SettingsLayoutBase } from '@/components/SettingsLayoutBase'
import { Pill } from '@/components/Pill'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getAssignmentRules,
  createAssignmentRule,
  updateAssignmentRule,
  deleteAssignmentRule,
  AssignmentRuleRecord,
} from '@/services/assignment-rules'
import { getCategories, CategoryRecord } from '@/services/categories'
import { getTeams, TeamRecord } from '@/services/teams'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

interface AgentLite {
  id: string
  name: string
}

const PRIORITY_LABEL = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
} as const

function RuleDialog({
  rule,
  categories,
  teams,
  agents,
  children,
}: {
  rule?: AssignmentRuleRecord
  categories: CategoryRecord[]
  teams: TeamRecord[]
  agents: AgentLite[]
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [conditionPriority, setConditionPriority] = useState<string>('any')
  const [conditionCategory, setConditionCategory] = useState<string>('any')
  const [assignTeam, setAssignTeam] = useState<string>('none')
  const [assignUser, setAssignUser] = useState<string>('none')
  const [order, setOrder] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(rule?.name || '')
      setDescription(rule?.description || '')
      setConditionPriority(rule?.condition_priority || 'any')
      setConditionCategory(rule?.condition_category || 'any')
      setAssignTeam(rule?.assign_to_team || 'none')
      setAssignUser(rule?.assign_to_user || 'none')
      setOrder(rule?.priority_order ?? 0)
      setIsActive(rule?.is_active ?? true)
      setErrors({})
    }
  }, [open, rule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      const payload = {
        name,
        description: description || undefined,
        condition_priority: conditionPriority === 'any' ? undefined : conditionPriority,
        condition_category: conditionCategory === 'any' ? undefined : conditionCategory,
        assign_to_team: assignTeam === 'none' ? undefined : assignTeam,
        assign_to_user: assignUser === 'none' ? undefined : assignUser,
        priority_order: order,
        is_active: isActive,
      }
      if (rule) {
        await updateAssignmentRule(rule.id, payload)
        toast({ title: 'Regra atualizada!' })
      } else {
        await createAssignmentRule(payload)
        toast({ title: 'Regra criada!' })
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
            <Plus className="h-4 w-4" /> Nova regra
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{rule ? 'Editar regra' : 'Nova regra de atribuição'}</DialogTitle>
            <DialogDescription>
              Quando um chamado for criado e bater nas condições, atribui automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Urgentes para Suporte L2"
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

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Quando
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Prioridade</Label>
                  <Select value={conditionPriority} onValueChange={setConditionPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer</SelectItem>
                      {(Object.keys(PRIORITY_LABEL) as (keyof typeof PRIORITY_LABEL)[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={conditionCategory} onValueChange={setConditionCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Atribuir a
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Time</Label>
                  <Select value={assignTeam} onValueChange={setAssignTeam}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Agente</Label>
                  <Select value={assignUser} onValueChange={setAssignUser}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="order">Ordem (menor = maior prioridade)</Label>
                <Input
                  id="order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-end justify-between pb-1">
                <Label htmlFor="active">Ativa</Label>
                <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
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

export function SettingsAssignmentRules() {
  const [rules, setRules] = useState<AssignmentRuleRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [teams, setTeams] = useState<TeamRecord[]>([])
  const [agents, setAgents] = useState<AgentLite[]>([])
  const { toast } = useToast()

  const load = async () => {
    try {
      const [rs, cs, ts, ag] = await Promise.all([
        getAssignmentRules(),
        getCategories(),
        getTeams(),
        pb.collection('users').getFullList({ filter: "role='agent' || role='admin'" }),
      ])
      setRules(rs)
      setCategories(cs)
      setTeams(ts)
      setAgents(ag as unknown as AgentLite[])
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('assignment_rules', load)

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignmentRule(id)
      toast({ title: 'Regra removida!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao remover',
        description: getErrorMessage(err),
      })
    }
  }

  const moveOrder = async (rule: AssignmentRuleRecord, delta: number) => {
    try {
      await updateAssignmentRule(rule.id, {
        priority_order: (rule.priority_order || 0) + delta,
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao reordenar',
        description: getErrorMessage(err),
      })
    }
  }

  return (
    <SettingsLayoutBase
      title="Regras de Atribuição"
      description="Atribuição automática de chamados baseada em prioridade e categoria."
      headerActions={<RuleDialog categories={categories} teams={teams} agents={agents} />}
    >
      {rules.length > 0 ? (
        <div className="space-y-2">
          {rules.map((r) => (
            <Card key={r.id} className="group">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveOrder(r, -1)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-gray-500 text-center">{r.priority_order || 0}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveOrder(r, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold">{r.name}</h3>
                    {r.is_active ? (
                      <Pill color="green" label="Ativa" bullet />
                    ) : (
                      <Pill color="gray" label="Inativa" />
                    )}
                  </div>
                  {r.description && <p className="text-xs text-gray-500 mb-2">{r.description}</p>}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="text-gray-500">Quando:</span>
                    {r.condition_priority && (
                      <Pill color="blue" label={`Prio: ${PRIORITY_LABEL[r.condition_priority]}`} />
                    )}
                    {r.expand?.condition_category && (
                      <Pill color="violet" label={r.expand.condition_category.name} />
                    )}
                    {!r.condition_priority && !r.condition_category && (
                      <span className="text-gray-400 italic">qualquer chamado</span>
                    )}
                    <span className="text-gray-500 ml-2">→ Atribuir a:</span>
                    {r.expand?.assign_to_team && (
                      <Pill color="violet" label={`Time: ${r.expand.assign_to_team.name}`} />
                    )}
                    {r.expand?.assign_to_user && (
                      <Pill color="blue" label={r.expand.assign_to_user.name} />
                    )}
                    {!r.assign_to_team && !r.assign_to_user && (
                      <span className="text-gray-400 italic">ninguém</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <RuleDialog rule={r} categories={categories} teams={teams} agents={agents}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </RuleDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(r.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GitFork}
          title="Nenhuma regra"
          description="Crie regras para atribuir chamados automaticamente."
          action={<RuleDialog categories={categories} teams={teams} agents={agents} />}
        />
      )}
    </SettingsLayoutBase>
  )
}
