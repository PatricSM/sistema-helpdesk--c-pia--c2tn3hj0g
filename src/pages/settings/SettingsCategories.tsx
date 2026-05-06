import { Link } from 'react-router-dom'
import { Tag, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsLayoutBase } from '@/components/SettingsLayoutBase'
import { EmptyState } from '@/components/EmptyState'

export function SettingsCategories() {
  return (
    <SettingsLayoutBase
      title="Categorias"
      description="Categorias compartilhadas entre chamados e base de conhecimento."
    >
      <EmptyState
        icon={Tag}
        title="Gestão completa em /categories"
        description="A página dedicada possui CRUD completo com seleção de cores. Esta seção apenas centraliza o atalho."
        action={
          <Button asChild className="gap-1.5" size="sm">
            <Link to="/categories">
              <ExternalLink className="h-4 w-4" /> Abrir gestão de categorias
            </Link>
          </Button>
        }
      />
    </SettingsLayoutBase>
  )
}
