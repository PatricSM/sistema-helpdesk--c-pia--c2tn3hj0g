import { BookOpen } from 'lucide-react'

export function PublicDocsHome() {
  return (
    <div className="flex flex-col items-center justify-center h-full pt-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <BookOpen className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
        Como podemos ajudar?
      </h1>
      <p className="text-muted-foreground max-w-md text-lg">
        Navegue pelos artigos na barra lateral para encontrar respostas para suas dúvidas, tutoriais
        e guias.
      </p>
    </div>
  )
}
