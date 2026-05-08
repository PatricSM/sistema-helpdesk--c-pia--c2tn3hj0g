import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { TicketFormFields } from '@/components/TicketFormFields'
import pb from '@/lib/pocketbase/client'

export default function EmbedForm() {
  const { key } = useParams()
  const [formData, setFormData] = useState({
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
  const [ticketId, setTicketId] = useState('')

  useEffect(() => {
    setFormLoadedAt(Date.now())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lgpd) {
      setErrorMessage('Você deve aceitar os Termos e Condições (LGPD).')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const record = await pb.collection('embed_submissions').create({
        embed_key: key,
        honeypot: formData.website,
        loaded_at: formLoadedAt,
        name: formData.name,
        email: formData.email,
        title: formData.subject,
        description: formData.description,
        lgpd: formData.lgpd,
      })

      if (record.ticket) {
        setTicketId(record.ticket)
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

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-transparent p-4 flex items-center justify-center">
        <Alert className="max-w-md bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Sucesso!</AlertTitle>
          <AlertDescription className="text-green-700">
            Chamado #{ticketId} criado. Enviamos um e-mail para você com os detalhes.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-4 font-sans">
      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Abrir Chamado</h2>

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

        <Button type="submit" className="w-full" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Enviando...' : 'Enviar Chamado'}
        </Button>
      </form>
    </div>
  )
}
