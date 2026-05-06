import { useEffect, useState } from 'react'
import { Plus, Building2, Pencil, Trash } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  CustomerRecord,
} from '@/services/customers'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

function CustomerDialog({
  customer,
  children,
}: {
  customer?: CustomerRecord
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(customer?.name || '')
      setWebsite(customer?.website || '')
      setIndustry(customer?.industry || '')
      setNotes(customer?.notes || '')
      setErrors({})
    }
  }, [open, customer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      if (customer) {
        await updateCustomer(customer.id, { name, website, industry, notes })
        toast({ title: 'Cliente atualizado!' })
      } else {
        await createCustomer({ name, website, industry, notes })
        toast({ title: 'Cliente criado!' })
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
            <DialogTitle>{customer ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
            <DialogDescription>Empresa ou organização que abre chamados.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="industry">Setor</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Ex: Tecnologia"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
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

export default function Customers() {
  const { user } = useAuth()
  const isAgentOrAdmin = user?.role === 'admin' || user?.role === 'agent'
  const isAdmin = user?.role === 'admin'

  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const load = async () => {
    try {
      setCustomers(await getCustomers())
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('customers', load)

  const filtered = customers.filter((c) =>
    !search ? true : c.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id)
      toast({ title: 'Cliente removido!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao remover',
        description: getErrorMessage(err),
      })
    }
  }

  const columns: ListColumn<CustomerRecord>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={c.logo} />
            <AvatarFallback className="text-xs bg-violet-100 text-violet-700">
              {c.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-gray-900">{c.name}</span>
        </div>
      ),
    },
    {
      key: 'industry',
      label: 'Setor',
      width: '180px',
      render: (c) => <span className="text-sm text-gray-600">{c.industry || '—'}</span>,
    },
    {
      key: 'website',
      label: 'Website',
      width: '220px',
      render: (c) =>
        c.website ? (
          <a
            href={c.website}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline truncate block"
            onClick={(e) => e.stopPropagation()}
          >
            {c.website.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    ...(isAgentOrAdmin
      ? ([
          {
            key: 'actions',
            label: '',
            width: '100px',
            align: 'right',
            render: (c) => (
              <div
                className="flex items-center justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <CustomerDialog customer={c}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </CustomerDialog>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Contatos vinculados ficarão sem cliente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(c.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ),
          },
        ] as ListColumn<CustomerRecord>[])
      : []),
  ]

  return (
    <>
      <PageHeader>
        <PageTitle
          title="Clientes"
          icon={Building2}
          rightSlot={isAgentOrAdmin ? <CustomerDialog /> : null}
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
              icon={Building2}
              title="Nenhum cliente"
              description="Cadastre clientes para vincular a chamados e contatos."
              action={isAgentOrAdmin ? <CustomerDialog /> : undefined}
            />
          }
        />
      </div>
    </>
  )
}
