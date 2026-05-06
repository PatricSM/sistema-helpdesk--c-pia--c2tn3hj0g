import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { LifeBuoy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (isSignUp) {
      const { error } = await signUp(email, password, name)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else navigate('/')
    } else {
      const { error } = await signIn(email, password)
      if (error)
        toast({ title: 'Erro', description: 'E-mail ou senha inválidos', variant: 'destructive' })
      else navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-10 w-10 rounded-md bg-gray-900 flex items-center justify-center mb-3">
            <LifeBuoy className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Helpdesk</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSignUp ? 'Crie sua conta para continuar' : 'Entre com seu e-mail e senha'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          {isSignUp && (
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
          )}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isSignUp ? 8 : undefined}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            disabled={loading}
          >
            {loading ? 'Aguarde…' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </Button>
        </form>

        <button
          type="button"
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-900"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </div>
  )
}
