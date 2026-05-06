import { useEffect, useState } from 'react'
import { Plus, UserPlus, Mail, Shield, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SettingsLayoutBase } from '@/components/SettingsLayoutBase'
import { Pill } from '@/components/Pill'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

type Role = 'agent' | 'admin'

interface AgentRow {
  id: string
  name: string
  email: string
  role: 'agent' | 'admin' | 'client'
  created: string
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  agent: 'Agente',
  client: 'Cliente',
}
const ROLE_COLOR: Record<string, string> = {
  admin: 'violet',
  agent: 'blue',
  client: 'gray',
}

function InviteDialog({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('agent')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      await pb.collection('users').create({
        name,
        email,
        password,
        passwordConfirm: password,
        role,
      })
      toast({
        title: 'Agente criado!',
        description: 'A senha temporária pode ser compartilhada por canal seguro.',
      })
      setName('')
      setEmail('')
      setPassword('')
      setRole('agent')
      setOpen(false)
      onInvited()
    } catch (err) {
      const f = extractFieldErrors(err)
      if (Object.keys(f).length > 0) setErrors(f)
      else
        toast({
          variant: 'destructive',
          title: 'Erro ao criar',
          description: getErrorMessage(err),
        })
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$'
    let pw = ''
    for (let i = 0; i < 12; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length))
    setPassword(pw)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5" size="sm">
          <Plus className="h-4 w-4" /> Convidar agente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Convidar novo agente</DialogTitle>
            <DialogDescription>
              Cria um usuário com perfil de Agente ou Admin. Em produção isso enviaria um e-mail de
              convite — aqui você define a senha inicial.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errors.email && <span className="text-xs text-destructive">{errors.email}</span>}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha temporária *</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0"
                  onClick={generatePassword}
                >
                  Gerar
                </Button>
              </div>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              {errors.password && (
                <span className="text-xs text-destructive">{errors.password}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Papel</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Criar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SettingsInviteAgents() {
  const [users, setUsers] = useState<AgentRow[]>([])
  const { toast } = useToast()

  const load = async () => {
    try {
      const list = await pb
        .collection('users')
        .getFullList({ filter: "role='agent' || role='admin'", sort: 'name' })
      setUsers(list as unknown as AgentRow[])
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await pb.collection('users').delete(id)
      toast({ title: 'Agente removido!' })
      load()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao remover',
        description: getErrorMessage(err),
      })
    }
  }

  return (
    <SettingsLayoutBase
      title="Convidar Agentes"
      description="Adicione agentes e administradores ao seu helpdesk."
      headerActions={<InviteDialog onInvited={load} />}
    >
      {users.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {users.map((u) => (
                <li key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`} />
                      <AvatarFallback>{u.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill color={ROLE_COLOR[u.role]} label={ROLE_LABEL[u.role]} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover agente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O usuário será excluído. Chamados atribuídos a ele ficarão sem assignee.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(u.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={UserPlus}
          title="Nenhum agente"
          description="Convide agentes para começarem a atender chamados."
          action={<InviteDialog onInvited={load} />}
        />
      )}
    </SettingsLayoutBase>
  )
}
