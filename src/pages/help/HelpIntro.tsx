import { Link } from 'react-router-dom'
import { ArrowRight, Ticket, BookOpen, Building2, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { HelpLayout } from './HelpLayout'

export function HelpIntro() {
  return (
    <HelpLayout
      title="Bem-vindo ao Helpdesk"
      subtitle="Visão geral do sistema e primeiros passos para times de suporte."
    >
      <p>
        Este Helpdesk é uma central de atendimento que permite registrar, atribuir e acompanhar
        chamados de clientes — com base de conhecimento, respostas prontas, SLA configurável e
        atribuição automática.
      </p>

      <h2>Quem usa o sistema</h2>
      <ul>
        <li>
          <strong>Administradores</strong> configuram categorias, SLA, times, agentes e regras de
          atribuição.
        </li>
        <li>
          <strong>Agentes</strong> atendem chamados, escrevem respostas, colaboram via notas
          internas e mantêm a base de conhecimento.
        </li>
        <li>
          <strong>Clientes</strong> abrem chamados, acompanham respostas e consultam artigos
          publicados.
        </li>
      </ul>

      <h2>Por onde começar</h2>
      <p>Acesse cada módulo pela barra lateral. Os atalhos abaixo levam às seções principais:</p>

      <div className="not-prose grid gap-3 sm:grid-cols-2 mt-4">
        <ShortcutCard
          to="/tickets"
          icon={Ticket}
          title="Abrir um chamado"
          description="Registre um novo atendimento ou veja a fila"
        />
        <ShortcutCard
          to="/knowledge-base"
          icon={BookOpen}
          title="Consultar artigos"
          description="Encontre respostas na base de conhecimento"
        />
        <ShortcutCard
          to="/customers"
          icon={Building2}
          title="Cadastrar clientes"
          description="Empresas e contatos vinculados"
        />
        <ShortcutCard
          to="/settings"
          icon={Settings}
          title="Configurar"
          description="SLA, categorias, times e regras de atribuição"
        />
      </div>

      <h2 className="mt-8">Visão de papéis em uma frase</h2>
      <p>
        Clientes só veem os próprios chamados. Agentes veem todos. Admins gerenciam categorias,
        times, agentes, SLA e regras de atribuição. Notas internas só são visíveis para staff
        (agentes/admins).
      </p>
    </HelpLayout>
  )
}

function ShortcutCard({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Link to={to}>
      <Card className="border-gray-200 hover:border-gray-300 transition-colors group">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-gray-700" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-700 transition-colors" />
        </CardContent>
      </Card>
    </Link>
  )
}
