import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Users, Trash, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { Pill } from '@/components/Pill'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import {
  getTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  TeamRecord,
  TeamMemberRecord,
} from '@/services/teams'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface AgentLite {
  id: string
  name: string
  email: string
  role: string
}

export default function TeamDetail() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [team, setTeam] = useState<TeamRecord | null>(null)
  const [members, setMembers] = useState<TeamMemberRecord[]>([])
  const [allAgents, setAllAgents] = useState<AgentLite[]>([])

  const load = async () => {
    if (!id) return
    try {
      const [t, m, agents] = await Promise.all([
        getTeam(id),
        getTeamMembers(id),
        pb.collection('users').getFullList({ filter: "role='agent' || role='admin'" }),
      ])
      setTeam(t)
      setMembers(m)
      setAllAgents(agents as unknown as AgentLite[])
    } catch {
      navigate('/teams')
    }
  }

  useEffect(() => {
    load()
  }, [id])

  if (!isAdmin) return <Navigate to="/" replace />

  if (!team) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Carregando…
      </div>
    )
  }

  const memberUserIds = new Set(members.map((m) => m.user))
  const availableAgents = allAgents.filter((a) => !memberUserIds.has(a.id))

  return (
    <>
      <PageHeader>
        <PageTitle
          title={team.name}
          icon={Users}
          leftSlot={
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link to="/teams">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          }
          rightSlot={
            <AddMemberDialog availableAgents={availableAgents} teamId={team.id} onAdded={load} />
          }
        />
      </PageHeader>

      <div className="px-5 py-5 space-y-6 max-w-3xl">
        {team.description && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">{team.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="border-b py-3">
            <h2 className="text-sm font-semibold">Membros ({members.length})</h2>
          </CardHeader>
          <CardContent className="p-0">
            {members.length > 0 ? (
              <ul className="divide-y">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={`https://img.usecurling.com/ppl/thumbnail?seed=${m.user}`}
                        />
                        <AvatarFallback>{m.expand?.user?.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{m.expand?.user?.name || '—'}</p>
                        <p className="text-xs text-gray-500">{m.expand?.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Pill
                        color={m.role === 'lead' ? 'violet' : 'gray'}
                        label={m.role === 'lead' ? 'Lead' : 'Membro'}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={async () => {
                          try {
                            await removeTeamMember(m.id)
                            toast({ title: 'Membro removido!' })
                            load()
                          } catch (err) {
                            toast({
                              variant: 'destructive',
                              title: 'Falha ao remover',
                              description: getErrorMessage(err),
                            })
                          }
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic p-6 text-center">
                Sem membros. Adicione um agente acima.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function AddMemberDialog({
  availableAgents,
  teamId,
  onAdded,
}: {
  availableAgents: AgentLite[]
  teamId: string
  onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<'member' | 'lead'>('member')
  const { toast } = useToast()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white" size="sm">
          <Plus className="h-4 w-4" /> Adicionar membro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar membro</DialogTitle>
          <DialogDescription>Selecione um agente para incluir neste time.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Agente</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {availableAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'member' | 'lead')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!userId}
            onClick={async () => {
              try {
                await addTeamMember({ team: teamId, user: userId, role })
                toast({ title: 'Membro adicionado!' })
                setUserId('')
                setRole('member')
                setOpen(false)
                onAdded()
              } catch (err) {
                toast({
                  variant: 'destructive',
                  title: 'Falha ao adicionar',
                  description: getErrorMessage(err),
                })
              }
            }}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
