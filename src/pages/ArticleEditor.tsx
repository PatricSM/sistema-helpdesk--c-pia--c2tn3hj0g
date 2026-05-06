import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/RichTextEditor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getArticle, createArticle, updateArticle, deleteArticle } from '@/services/knowledge_base'
import { getCategories, CategoryRecord } from '@/services/categories'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const isAgentOrAdmin = user?.role === 'admin' || user?.role === 'agent'

  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isNew) return
    getArticle(id!)
      .then((a) => {
        setTitle(a.title)
        setContent(a.content)
        setCategory(a.category || '')
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Artigo não encontrado' })
        navigate('/knowledge-base')
      })
  }, [id, isNew, navigate, toast])

  if (!isAgentOrAdmin) return <Navigate to="/knowledge-base" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    const payload = { title, content, category: category || undefined }
    try {
      if (isNew) {
        const rec = await createArticle(payload)
        toast({ title: 'Artigo criado!' })
        navigate(`/knowledge-base/${rec.id}`)
      } else {
        await updateArticle(id!, payload)
        toast({ title: 'Artigo atualizado!' })
        navigate(`/knowledge-base/${id}`)
      }
    } catch (err) {
      const f = extractFieldErrors(err)
      if (Object.keys(f).length > 0) setErrors(f)
      else
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: getErrorMessage(err),
        })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isNew) return
    try {
      await deleteArticle(id!)
      toast({ title: 'Artigo excluído!' })
      navigate('/knowledge-base')
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao excluir',
        description: getErrorMessage(err),
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/knowledge-base">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? 'Novo Artigo' : 'Editar Artigo'}
            </h1>
            <p className="text-xs text-muted-foreground">Base de conhecimento</p>
          </div>
        </div>
        {!isNew && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive">
                <Trash className="h-3.5 w-3.5" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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
                placeholder="Ex: Como redefinir minha senha"
                required
              />
              {errors.title && <span className="text-xs text-destructive">{errors.title}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Escreva o artigo aqui..."
                minHeight="300px"
              />
              {errors.content && <span className="text-xs text-destructive">{errors.content}</span>}
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select
                value={category || 'none'}
                onValueChange={(v) => setCategory(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
