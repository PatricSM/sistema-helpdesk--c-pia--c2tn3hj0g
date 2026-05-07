import { useState, useEffect } from 'react'
import { Plus, Copy, Edit, Check, Trash2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getEmbedKeys, createEmbedKey, updateEmbedKey, deleteEmbedKey } from '@/services/embed_keys'

export function SettingsEmbedKeys() {
  const [keys, setKeys] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [formData, setFormData] = useState<any>({
    name: '',
    allowed_origins: '',
    default_category: '',
    default_team: '',
    is_active: true,
  })
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [k, c, t] = await Promise.all([
        getEmbedKeys(),
        pb.collection('categories').getFullList(),
        pb.collection('teams').getFullList(),
      ])
      setKeys(k)
      setCategories(c)
      setTeams(t)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        key: formData.id ? formData.key : crypto.randomUUID().replace(/-/g, ''),
        allowed_origins:
          typeof formData.allowed_origins === 'string'
            ? formData.allowed_origins
                .split('\n')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : formData.allowed_origins,
        default_category: formData.default_category,
        default_team: formData.default_team || null,
        is_active: formData.is_active,
        created_by: pb.authStore.record?.id,
      }

      if (formData.id) {
        await updateEmbedKey(formData.id, payload)
      } else {
        await createEmbedKey(payload)
      }
      toast({ title: 'Sucesso', description: 'Embed salvo com sucesso.' })
      setOpen(false)
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateEmbedKey(id, { is_active: !currentStatus })
      toast({ title: 'Status atualizado com sucesso' })
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await deleteEmbedKey(selectedId)
      toast({ title: 'Embed removido com sucesso' })
      setDeleteOpen(false)
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao remover', description: e.message, variant: 'destructive' })
    }
  }

  const [copiedId, setCopiedId] = useState('')
  const handleCopy = (keyStr: string, id: string) => {
    const baseUrl = import.meta.env.VITE_EMBED_BASE_URL || window.location.origin
    const html = `<iframe src="${baseUrl}/embed/form/${keyStr}" width="100%" height="600" frameborder="0"></iframe>`
    navigator.clipboard.writeText(html)
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Formulários Embed</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as chaves de integração para formulários externos.
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              name: '',
              allowed_origins: '',
              default_category: '',
              default_team: '',
              is_active: true,
            })
            setOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Embed
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria Padrão</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum embed configurado.
                </TableCell>
              </TableRow>
            )}
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell>{k.expand?.default_category?.name}</TableCell>
                <TableCell>
                  <Switch
                    checked={k.is_active}
                    onCheckedChange={() => handleToggleActive(k.id, k.is_active)}
                  />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(k.key, k.id)}
                    title="Copiar HTML do iframe"
                  >
                    {copiedId === k.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...k,
                        allowed_origins: Array.isArray(k.allowed_origins)
                          ? k.allowed_origins.join('\n')
                          : '',
                      })
                      setOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedId(k.id)
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Editar Embed' : 'Novo Embed'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Site Principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Origens Permitidas</Label>
              <Textarea
                value={formData.allowed_origins}
                onChange={(e) => setFormData({ ...formData, allowed_origins: e.target.value })}
                placeholder="https://meusite.com&#10;https://outro.com"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Uma URL por linha. Use * para permitir qualquer origem.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Categoria Padrão</Label>
              <Select
                value={formData.default_category}
                onValueChange={(v) => setFormData({ ...formData, default_category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Padrão (Opcional)</Label>
              <Select
                value={formData.default_team || 'none'}
                onValueChange={(v) =>
                  setFormData({ ...formData, default_team: v === 'none' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
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
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Embed</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a chave de integração.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
