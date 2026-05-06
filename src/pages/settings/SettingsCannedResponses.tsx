import { Link } from 'react-router-dom'
import { MessageSquareQuote, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsLayoutBase } from '@/components/SettingsLayoutBase'
import { EmptyState } from '@/components/EmptyState'

export function SettingsCannedResponses() {
  return (
    <SettingsLayoutBase
      title="Respostas Prontas"
      description="Modelos reutilizáveis de mensagens para os chamados."
    >
      <EmptyState
        icon={MessageSquareQuote}
        title="Gestão completa em /canned-responses"
        description="A página dedicada possui CRUD com atalhos por agente."
        action={
          <Button asChild className="gap-1.5" size="sm">
            <Link to="/canned-responses">
              <ExternalLink className="h-4 w-4" /> Abrir gestão de respostas
            </Link>
          </Button>
        }
      />
    </SettingsLayoutBase>
  )
}
