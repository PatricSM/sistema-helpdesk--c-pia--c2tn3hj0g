import { useParams, Navigate } from 'react-router-dom'
import { HelpIntro } from './help/HelpIntro'
import { HelpTickets } from './help/HelpTickets'
import { HelpKB } from './help/HelpKB'
import { HelpOrganization } from './help/HelpOrganization'
import { HelpSLA } from './help/HelpSLA'
import { HelpNotifications } from './help/HelpNotifications'
import { HelpShortcuts } from './help/HelpShortcuts'
import { HelpAPI } from './help/HelpAPI'

const components: Record<string, React.ComponentType> = {
  intro: HelpIntro,
  tickets: HelpTickets,
  kb: HelpKB,
  organization: HelpOrganization,
  sla: HelpSLA,
  notifications: HelpNotifications,
  shortcuts: HelpShortcuts,
  api: HelpAPI,
}

export default function DocsTopicResolver() {
  const { topic } = useParams<{ topic: string }>()

  if (!topic || !components[topic]) {
    return <Navigate to="/docs/intro" replace />
  }

  const Component = components[topic]

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Component />
    </div>
  )
}
