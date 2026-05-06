import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, AlertOctagon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
      <div className="text-center max-w-md space-y-3">
        <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
          <AlertOctagon className="h-7 w-7 text-gray-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Página não encontrada</h1>
        <p className="text-sm text-gray-600">
          A rota{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{location.pathname}</code> não
          existe.
        </p>
        <Button asChild variant="outline" className="gap-1.5 mt-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Voltar para o início
          </Link>
        </Button>
      </div>
    </div>
  )
}
