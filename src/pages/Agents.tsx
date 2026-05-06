import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Users, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PageHeader } from '@/components/PageHeader'
import { PageTitle } from '@/components/PageTitle'
import { ListView, ListColumn } from '@/components/ListView'
import { ListToolbar } from '@/components/ListToolbar'
import { Pill } from '@/components/Pill'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

interface UserRow {
  id: string
  name: string
  email: string
  role?: 'admin' | 'agent' | 'client'
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

export default function Agents() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      const list = await pb.collection('users').getFullList({ sort: 'name' })
      setUsers(list as unknown as UserRow[])
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (!isAdmin) return <Navigate to="/" replace />

  const filtered = users.filter((u) =>
    !search
      ? true
      : u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: ListColumn<UserRow>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7">
            <AvatarImage src={`https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`} />
            <AvatarFallback className="text-xs">{u.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-gray-900">{u.name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'E-mail',
      width: '260px',
      render: (u) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
          <Mail className="h-3.5 w-3.5 text-gray-400" />
          {u.email}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Papel',
      width: '140px',
      render: (u) => (
        <Pill color={ROLE_COLOR[u.role || 'client']} label={ROLE_LABEL[u.role || 'client']} />
      ),
    },
  ]

  return (
    <>
      <PageHeader>
        <PageTitle title="Agentes & Usuários" icon={Users} />
      </PageHeader>

      <ListToolbar
        leftSlot={
          <Input
            placeholder="Buscar por nome ou email..."
            className="h-8 w-72 text-sm"
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
          emptyState={<EmptyState icon={Users} title="Nenhum usuário" />}
        />
      </div>
    </>
  )
}
