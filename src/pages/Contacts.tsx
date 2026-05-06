import { useEffect, useState } from 'react'
import { Plus, Contact2, Pencil, Trash, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  ContactRecord,
} from '@/services/contacts'
import { getCustomers, CustomerRecord } from '@/services/customers'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

function ContactDialog({
  contact,
  customers,
  children,
}: {
  contact?: ContactRecord
  customers: CustomerRecord[]
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [customer, setCustomer] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(contact?.name || '')
      setEmail(contact?.email || '')
      setPhone(contact?.phone || '')
      setMobile(contact?.mobile || '')
      setCustomer(contact?.customer || '')
      setNotes(contact?.notes || '')
      setErrors({})
    }
  }, [open, contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      const payload = {
        name,
        email: email || undefined,
        phone: phone || undefined,
        mobile: mobile || undefined,
        customer: customer || undefined,
        notes: notes || undefined,
      }
      if (contact) {
        await updateContact(contact.id, payload)
        toast({ title: 'Contato atualizado!' })
      } else {
        await createContact(payload)
        toast({ title: 'Contato criado!' })
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
            <DialogTitle>{contact ? 'Editar contato' : 'Novo contato'}</DialogTitle>
            <DialogDescription>Pessoa vinculada a um cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile">Celular</Label>
                <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Select
                value={customer || 'none'}
                onValueChange={(v) => setCustomer(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem cliente</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
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

export default function Contacts() {
  const { user } = useAuth()
  const isAgentOrAdmin = user?.role === 'admin' || user?.role === 'agent'
  const isAdmin = user?.role === 'admin'

  const [contacts, setContacts] = useState<ContactRecord[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const load = async () => {
    try {
      const [cs, custs] = await Promise.all([getContacts(), getCustomers()])
      setContacts(cs)
      setCustomers(custs)
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('contacts', load)

  const filtered = contacts.filter((c) =>
    !search
      ? true
      : c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteContact(id)
      toast({ title: 'Contato removido!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao remover',
        description: getErrorMessage(err),
      })
    }
  }

  const columns: ListColumn<ContactRecord>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={`https://img.usecurling.com/ppl/thumbnail?seed=${c.id}`} />
            <AvatarFallback className="text-xs">{c.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-gray-900">{c.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'E-mail',
      width: '240px',
      render: (c) =>
        c.email ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            {c.email}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: 'phone',
      label: 'Telefone',
      width: '160px',
      render: (c) => {
        const tel = c.mobile || c.phone
        return tel ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            {tel}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )
      },
    },
    {
      key: 'customer',
      label: 'Cliente',
      width: '180px',
      render: (c) =>
        c.expand?.customer ? (
          <span className="text-sm text-gray-700">{c.expand.customer.name}</span>
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
                <ContactDialog contact={c} customers={customers}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </ContactDialog>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
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
        ] as ListColumn<ContactRecord>[])
      : []),
  ]

  return (
    <>
      <PageHeader>
        <PageTitle
          title="Contatos"
          icon={Contact2}
          rightSlot={isAgentOrAdmin ? <ContactDialog customers={customers} /> : null}
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
              icon={Contact2}
              title="Nenhum contato"
              description="Cadastre contatos das empresas que abrem chamados."
              action={isAgentOrAdmin ? <ContactDialog customers={customers} /> : undefined}
            />
          }
        />
      </div>
    </>
  )
}
