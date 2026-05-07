import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  Send,
  Lock,
  Mail,
  MessageSquare,
  Activity,
  Trash,
  Paperclip,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Pill } from '@/components/Pill'
import { TicketDialog } from '@/components/TicketDialog'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import {
  getTicket,
  updateTicket,
  deleteTicket,
  TicketRecord,
  TicketStatus,
  TicketPriority,
  TicketType,
} from '@/services/tickets'
import { getComments, createComment, getAttachmentUrl, CommentRecord } from '@/services/comments'
import { getCategories, CategoryRecord } from '@/services/categories'
import { getCannedResponses, CannedResponseRecord } from '@/services/canned_responses'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { Ticket as TicketIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}
const STATUS_COLOR: Record<TicketStatus, string> = {
  open: 'red',
  in_progress: 'amber',
  resolved: 'green',
  closed: 'gray',
}
const TYPE_LABEL: Record<TicketType, string> = {
  question: 'Question',
  incident: 'Incident',
  bug: 'Bug',
  unspecified: 'Unspecified',
}

interface AgentUser {
  id: string
  name: string
  email: string
  role: string
}

export default function TicketDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const isAgentOrAdmin = user?.role === 'admin' || user?.role === 'agent'
  const isAdmin = user?.role === 'admin'

  const [ticket, setTicket] = useState<TicketRecord | null>(null)
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [agents, setAgents] = useState<AgentUser[]>([])
  const [canned, setCanned] = useState<CannedResponseRecord[]>([])

  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showAllActivity, setShowAllActivity] = useState(true)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [composeMode, setComposeMode] = useState<'reply' | 'comment'>('reply')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    if (!id) return
    try {
      const [t, c, cats] = await Promise.all([
        getTicket(id),
        getComments(id) as Promise<CommentRecord[]>,
        getCategories(),
      ])
      setTicket(t)
      setComments(c)
      setCategories(cats)
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao carregar chamado' })
      navigate('/tickets')
    }
  }

  useEffect(() => {
    load()
  }, [id])

  useEffect(() => {
    if (!isAgentOrAdmin) return
    pb.collection('users')
      .getFullList({ filter: "role='agent' || role='admin'" })
      .then((list) => setAgents(list as unknown as AgentUser[]))
      .catch(() => {})
    getCannedResponses()
      .then(setCanned)
      .catch(() => {})
  }, [isAgentOrAdmin])

  useRealtime('tickets', (e) => {
    if (e.record.id === id) load()
  })
  useRealtime('comments', (e) => {
    if (e.record.ticket === id) load()
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  if (!ticket) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Carregando…
      </div>
    )
  }

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      await updateTicket(ticket.id, { status })
      toast({ title: 'Status atualizado!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao atualizar status',
        description: getErrorMessage(err),
      })
    }
  }

  const handleFieldChange = async (field: string, value: string) => {
    try {
      await updateTicket(ticket.id, { [field]: value === 'unassigned' ? '' : value })
      toast({ title: 'Atualizado!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao atualizar',
        description: getErrorMessage(err),
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTicket(ticket.id)
      toast({ title: 'Chamado excluído!' })
      navigate('/tickets')
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao excluir',
        description: getErrorMessage(err),
      })
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!reply.trim() && pendingFiles.length === 0) || !user) return
    setSubmitting(true)
    try {
      const wantInternal = composeMode === 'comment' && isAgentOrAdmin
      await createComment({
        ticket: ticket.id,
        author: user.id,
        body: reply || '(anexos)',
        is_internal: wantInternal || isInternal,
        files: pendingFiles.length > 0 ? pendingFiles : null,
      })
      // Marca first_response_at se ainda não tem
      if (!ticket.first_response_at && isAgentOrAdmin && !wantInternal) {
        await updateTicket(ticket.id, { first_response_at: new Date().toISOString() })
      }
      setReply('')
      setPendingFiles([])
      setIsInternal(false)
      toast({ title: 'Enviado!' })
    } catch (err) {
      const f = extractFieldErrors(err)
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: Object.values(f).join(' ') || getErrorMessage(err),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const insertCanned = (text: string) => {
    setReply((prev) => (prev ? `${prev}\n\n${text}` : text))
  }

  const visibleComments = comments.filter((c) => isAgentOrAdmin || !c.is_internal)
  const publicComments = visibleComments.filter((c) => !c.is_internal)
  const internalComments = visibleComments.filter((c) => c.is_internal)

  // activity stream (sintético: created + cada comment + edits importantes)
  type ActivityItem =
    | { kind: 'created'; ts: string; by?: string }
    | {
        kind: 'reply' | 'comment'
        id: string
        ts: string
        by?: string
        text: string
        isInternal: boolean
      }

  const activities: ActivityItem[] = [
    { kind: 'created', ts: ticket.created, by: ticket.expand?.requester?.name },
    ...visibleComments.map<ActivityItem>((c) => ({
      kind: c.is_internal ? 'comment' : 'reply',
      id: c.id,
      ts: c.created,
      by: c.expand?.author?.name,
      text: c.body,
      isInternal: !!c.is_internal,
    })),
  ]

  return (
    <>
      <PageHeader>
        <PageTitle
          title={ticket.title}
          icon={TicketIcon}
          leftSlot={
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link to="/tickets">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          }
          rightSlot={
            <>
              <span className="text-xs text-gray-500">#{ticket.id.slice(-6)}</span>
              {isAgentOrAdmin && (
                <TicketDialog ticket={ticket} categories={categories}>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                </TicketDialog>
              )}
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-destructive">
                      <Trash className="h-3.5 w-3.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir chamado?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          }
        />
      </PageHeader>

      <div className="flex flex-1 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="conversation" className="flex flex-col h-full">
            <TabsList className="rounded-none border-b bg-transparent h-10 px-5 justify-start gap-4">
              <TabsTrigger
                value="conversation"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none px-0 h-10"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Conversa ({publicComments.length})
              </TabsTrigger>
              {isAgentOrAdmin && (
                <TabsTrigger
                  value="comments"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none px-0 h-10"
                >
                  <Lock className="h-3.5 w-3.5 mr-1.5" /> Notas internas ({internalComments.length})
                </TabsTrigger>
              )}
              <TabsTrigger
                value="activity"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none px-0 h-10"
              >
                <Activity className="h-3.5 w-3.5 mr-1.5" /> Atividade
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="flex-1 overflow-y-auto p-5 space-y-4 m-0">
              {/* Description original */}
              <CommentBubble
                authorName={ticket.expand?.requester?.name || 'Solicitante'}
                authorId={ticket.expand?.requester?.id || ticket.requester}
                ts={ticket.created}
                text={ticket.description}
              />
              {publicComments.map((c) => (
                <CommentBubble
                  key={c.id}
                  authorName={c.expand?.author?.name || 'Usuário'}
                  authorId={c.expand?.author?.id || c.author}
                  ts={c.created}
                  text={c.body}
                  comment={c}
                />
              ))}
              <div ref={messagesEndRef} />
            </TabsContent>

            {isAgentOrAdmin && (
              <TabsContent value="comments" className="flex-1 overflow-y-auto p-5 space-y-4 m-0">
                {internalComments.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-8">
                    Sem notas internas.
                  </p>
                )}
                {internalComments.map((c) => (
                  <CommentBubble
                    key={c.id}
                    authorName={c.expand?.author?.name || 'Usuário'}
                    authorId={c.expand?.author?.id || c.author}
                    ts={c.created}
                    text={c.body}
                    isInternal
                    comment={c}
                  />
                ))}
              </TabsContent>
            )}

            <TabsContent value="activity" className="flex-1 overflow-y-auto p-5 m-0">
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h3 className="text-sm font-semibold">Atividade</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-all" className="text-xs text-gray-600">
                    Show all activity
                  </Label>
                  <Switch
                    id="show-all"
                    checked={showAllActivity}
                    onCheckedChange={setShowAllActivity}
                  />
                </div>
              </div>
              <ol className="relative border-l border-gray-200 ml-2 space-y-5">
                {activities
                  .filter((a) => showAllActivity || a.kind !== 'comment')
                  .map((a, i) => (
                    <li key={i} className="ml-4 relative">
                      <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-gray-400" />
                      <div className="text-xs text-gray-500">{formatDate(a.ts)}</div>
                      <div className="text-sm text-gray-900 mt-0.5">
                        {a.kind === 'created' && (
                          <>
                            <span className="font-medium">{a.by || 'Alguém'}</span> abriu este
                            chamado
                          </>
                        )}
                        {a.kind === 'reply' && (
                          <>
                            <span className="font-medium">{a.by || 'Alguém'}</span> respondeu
                          </>
                        )}
                        {a.kind === 'comment' && (
                          <>
                            <span className="font-medium">{a.by || 'Alguém'}</span> deixou uma nota
                            interna
                          </>
                        )}
                      </div>
                      {(a.kind === 'reply' || a.kind === 'comment') && (
                        <div
                          className={cn(
                            'mt-2 text-sm rounded-lg p-3 border',
                            a.isInternal
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-gray-50 border-gray-200',
                          )}
                        >
                          <p className="whitespace-pre-wrap line-clamp-3">{a.text}</p>
                        </div>
                      )}
                    </li>
                  ))}
              </ol>
            </TabsContent>
          </Tabs>

          {/* Reply box */}
          <div className="border-t bg-white">
            <div className="px-5 py-2 border-b flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setComposeMode('reply')
                  setIsInternal(false)
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded font-medium',
                  composeMode === 'reply'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                <Mail className="h-3.5 w-3.5" /> Reply
              </button>
              {isAgentOrAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setComposeMode('comment')
                    setIsInternal(true)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded font-medium',
                    composeMode === 'comment'
                      ? 'bg-amber-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  <Lock className="h-3.5 w-3.5" /> Comment
                </button>
              )}
              {isAgentOrAdmin && canned.length > 0 && (
                <Select onValueChange={(v) => insertCanned(v)}>
                  <SelectTrigger className="ml-auto h-7 w-[200px] text-xs">
                    <SelectValue placeholder="Resposta pronta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {canned.map((cr) => (
                      <SelectItem key={cr.id} value={cr.body}>
                        {cr.title}
                        {cr.shortcut ? ` (${cr.shortcut})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <form onSubmit={handleReply} className="p-3">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={
                  composeMode === 'comment'
                    ? 'Escreva uma nota interna (não visível ao cliente)...'
                    : 'Escreva sua resposta...'
                }
                rows={3}
                className={cn(
                  'resize-none border-0 focus-visible:ring-0 shadow-none',
                  composeMode === 'comment' && 'bg-amber-50',
                )}
              />
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {pendingFiles.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs"
                    >
                      <Paperclip className="h-3 w-3 text-gray-500" />
                      <span className="max-w-[200px] truncate">{f.name}</span>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-destructive"
                        onClick={() => setPendingFiles(pendingFiles.filter((_, idx) => idx !== i))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files).slice(0, 5 - pendingFiles.length)
                    setPendingFiles([...pendingFiles, ...files])
                    e.target.value = ''
                  }
                }}
              />
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-gray-600"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pendingFiles.length >= 5}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Anexar {pendingFiles.length > 0 && `(${pendingFiles.length}/5)`}
                </Button>
                <Button
                  type="submit"
                  disabled={(!reply.trim() && pendingFiles.length === 0) || submitting}
                  size="sm"
                  className="gap-1.5 bg-gray-900 hover:bg-gray-800"
                >
                  <Send className="h-3.5 w-3.5" /> Enviar
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar de detalhes */}
        <aside className="w-[280px] border-l bg-white overflow-y-auto p-5 space-y-5 hidden lg:block">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Detalhes
            </h3>
            <div className="space-y-3">
              <Field label="Status">
                {isAgentOrAdmin ? (
                  <Select
                    value={ticket.status}
                    onValueChange={(v) => handleStatusChange(v as TicketStatus)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Pill
                    bullet
                    color={STATUS_COLOR[ticket.status]}
                    label={STATUS_LABEL[ticket.status]}
                  />
                )}
              </Field>

              <Field label="Prioridade">
                {isAgentOrAdmin ? (
                  <Select
                    value={ticket.priority}
                    onValueChange={(v) => handleFieldChange('priority', v as TicketPriority)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm">{ticket.priority}</span>
                )}
              </Field>

              <Field label="Type">
                {isAgentOrAdmin ? (
                  <Select
                    value={ticket.type || 'unspecified'}
                    onValueChange={(v) => handleFieldChange('type', v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TYPE_LABEL) as TicketType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm">{ticket.type ? TYPE_LABEL[ticket.type] : '—'}</span>
                )}
              </Field>

              <Field label="Categoria">
                {isAgentOrAdmin ? (
                  <Select
                    value={ticket.category || ''}
                    onValueChange={(v) => handleFieldChange('category', v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm">{ticket.expand?.category?.name || '—'}</span>
                )}
              </Field>

              {isAgentOrAdmin && (
                <Field label="Atribuído a">
                  <Select
                    value={ticket.assignee || 'unassigned'}
                    onValueChange={(v) => handleFieldChange('assignee', v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Não atribuído" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Não atribuído</SelectItem>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Solicitante
            </h3>
            {ticket.expand?.requester ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={`https://img.usecurling.com/ppl/thumbnail?seed=${ticket.expand.requester.id}`}
                  />
                  <AvatarFallback>{ticket.expand.requester.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ticket.expand.requester.name}</p>
                  <p className="text-xs text-gray-500 truncate">{ticket.expand.requester.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">—</p>
            )}
          </div>

          <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
            <p>Criado em {formatDate(ticket.created)}</p>
            <p>Atualizado em {formatDate(ticket.updated)}</p>
            {ticket.first_response_at && (
              <p>Primeira resposta em {formatDate(ticket.first_response_at)}</p>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}

function CommentBubble({
  authorName,
  authorId,
  ts,
  text,
  isInternal,
  comment,
}: {
  authorName: string
  authorId: string
  ts: string
  text: string
  isInternal?: boolean
  comment?: CommentRecord
}) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={`https://img.usecurling.com/ppl/thumbnail?seed=${authorId}`} />
        <AvatarFallback className="text-xs">{authorName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">{authorName}</span>
          <span className="text-xs text-gray-500">{formatDate(ts)}</span>
          {isInternal && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
              <Lock className="h-3 w-3" /> Nota interna
            </span>
          )}
          {comment?.source === 'email' && (
            <span
              className="inline-flex items-center gap-1 text-xs text-gray-500"
              title="Recebido por email"
            >
              <Mail className="h-3 w-3" />
            </span>
          )}
          {comment?.source === 'api' && (
            <span
              className="inline-flex items-center gap-1 text-xs text-gray-500"
              title="Recebido via API"
            >
              <Activity className="h-3 w-3" />
            </span>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-3 text-sm whitespace-pre-wrap leading-relaxed border',
            isInternal ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200',
          )}
        >
          {text}
        </div>
        {comment?.attachments && comment.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {comment.attachments.map((filename) => (
              <a
                key={filename}
                href={getAttachmentUrl(comment, filename)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Paperclip className="h-3 w-3 text-gray-400" />
                <span className="max-w-[180px] truncate">{filename}</span>
                <Download className="h-3 w-3 text-gray-400" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-500 font-normal">{label}</Label>
      <div>{children}</div>
    </div>
  )
}
