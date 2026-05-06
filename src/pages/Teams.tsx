import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Plus, Users, Pencil, Trash, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { getTeams, createTeam, updateTeam, deleteTeam, TeamRecord } from '@/services/teams'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280']

function TeamDialog({ team, children }: { team?: TeamRecord; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(team?.name || '')
      setDescription(team?.description || '')
      setColor(team?.color || PRESET_COLORS[0])
      setErrors({})
    }
  }, [open, team])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      if (team) {
        await updateTeam(team.id, { name, description, color })
        toast({ title: 'Time atualizado!' })
      } else {
        await createTeam({ name, description, color })
        toast({ title: 'Time criado!' })
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
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{team ? 'Editar time' : 'Novo time'}</DialogTitle>
            <DialogDescription>Agrupe agentes por especialidade ou função.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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

export default function Teams() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [teams, setTeams] = useState<TeamRecord[]>([])
  const { toast } = useToast()

  const load = async () => {
    try {
      setTeams(await getTeams())
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('teams', load)

  if (!isAdmin) return <Navigate to="/" replace />

  const handleDelete = async (id: string) => {
    try {
      await deleteTeam(id)
      toast({ title: 'Time removido!' })
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
      <PageHeader>
        <PageTitle title="Times" icon={Users} rightSlot={<TeamDialog />} />
      </PageHeader>

      <div className="px-5 py-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teams.length > 0 ? (
            teams.map((t) => (
              <Card key={t.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${t.color || '#6b7280'}20` }}
                    >
                      <Users className="h-5 w-5" style={{ color: t.color || '#6b7280' }} />
                    </div>
                    <Link
                      to={`/teams/${t.id}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                  {t.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                    <TeamDialog team={t}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        <Pencil className="h-3 w-3" /> Editar
                      </Button>
                    </TeamDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-destructive"
                        >
                          <Trash className="h-3 w-3" /> Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir time?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Membros do time serão desvinculados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(t.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState
                icon={Users}
                title="Nenhum time"
                description="Crie times para agrupar agentes por especialidade."
                action={<TeamDialog />}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
