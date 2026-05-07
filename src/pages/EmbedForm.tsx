import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle } from 'lucide-react'

declare global {
  interface Window {
    onloadTurnstileCallback?: () => void
    turnstile?: {
      render: (id: string, options: any) => void
    }
  }
}

export default function EmbedForm() {
  const { key } = useParams()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: '',
    lgpd: false,
  })
  const [captchaToken, setCaptchaToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [ticketId, setTicketId] = useState('')

  useEffect(() => {
    const script = document.createElement('script')
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    window.onloadTurnstileCallback = function () {
      if (window.turnstile) {
        window.turnstile.render('#turnstile-widget', {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
          callback: function (token: string) {
            setCaptchaToken(token)
          },
        })
      }
    }
    return () => {
      delete window.onloadTurnstileCallback
    }
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
      const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/embed/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embed_key: key,
          captcha_token: captchaToken,
          ...formData,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao enviar chamado. Tente novamente.')
      }

      setTicketId(data.ticket_id)
      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message)
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

        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={status === 'submitting'}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={status === 'submitting'}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Assunto</Label>
          <Input
            id="subject"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            disabled={status === 'submitting'}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={status === 'submitting'}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="lgpd"
            checked={formData.lgpd}
            onCheckedChange={(c) => setFormData({ ...formData, lgpd: c as boolean })}
            disabled={status === 'submitting'}
          />
          <Label htmlFor="lgpd" className="text-sm font-normal text-gray-600">
            Concordo com os Termos e Condições (LGPD)
          </Label>
        </div>

        <div id="turnstile-widget" className="min-h-[65px]"></div>

        <Button type="submit" className="w-full" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Enviando...' : 'Enviar Chamado'}
        </Button>
      </form>
    </div>
  )
}
