import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LifeBuoy } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Register() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signUp(email, password, name)
    setLoading(false)
    if (error) {
      toast({
        title: 'Erro ao cadastrar',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-10 w-10 rounded-md bg-gray-900 flex items-center justify-center mb-3">
            <LifeBuoy className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre-se como cliente para abrir chamados</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">
              Nome completo
            </Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            disabled={loading}
          >
            {loading ? 'Aguarde…' : 'Cadastrar'}
          </Button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-gray-900 hover:underline font-medium">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  )
}
