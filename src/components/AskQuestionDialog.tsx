import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { TicketFormFields, type TicketFormData } from './TicketFormFields'
import pb from '@/lib/pocketbase/client'

interface AskQuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AskQuestionDialog({ open, onOpenChange }: AskQuestionDialogProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    name: '',
    email: '',
    subject: '',
    description: '',
    website: '',
    lgpd: false,
  })
  const [formLoadedAt, setFormLoadedAt] = useState<number>(0)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        email: '',
        subject: '',
        description: '',
        website: '',
        lgpd: false,
      })
      setStatus('idle')
      setErrorMessage('')
      setFormLoadedAt(Date.now())
      setSubmittedEmail('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.lgpd) {
      setErrorMessage('Você deve aceitar os Termos e Condições (LGPD).')
      return
    }

    const embedKey = import.meta.env.VITE_DOCS_EMBED_KEY
    if (!embedKey) {
      setErrorMessage('Suporte indisponível no momento.')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const record = await pb.collection('embed_submissions').create({
        embed_key: embedKey,
        honeypot: formData.website,
        loaded_at: formLoadedAt,
        name: formData.name,
        email: formData.email,
        title: formData.subject,
        description: formData.description,
        lgpd: formData.lgpd,
      })

      if (record.ticket) {
        setSubmittedEmail(formData.email)
        setStatus('success')
      } else {
        throw new Error('Não foi possível enviar. Tente novamente em alguns instantes.')
      }
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(
        err.message || 'Não foi possível enviar. Tente novamente em alguns instantes.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {status === 'success' ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            <h2 className="text-2xl font-bold tracking-tight">Recebemos sua dúvida!</h2>
            <p className="text-muted-foreground">
              Enviamos uma confirmação para <strong>{submittedEmail}</strong>. Vamos responder por
              email assim que possível.
            </p>
            <DialogFooter className="mt-4 sm:justify-center w-full">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Tem mais dúvidas? Estamos aqui.</DialogTitle>
              <DialogDescription>
                Preencha o formulário abaixo e nossa equipe de suporte entrará em contato.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              {status === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <TicketFormFields
                formData={formData}
                setFormData={setFormData}
                disabled={status === 'submitting'}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  disabled={!formData.lgpd || status === 'submitting'}
                  className="w-full"
                >
                  {status === 'submitting' ? 'Enviando...' : 'Enviar dúvida'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
