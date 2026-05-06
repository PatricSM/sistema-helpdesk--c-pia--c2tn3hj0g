import { ReactNode } from 'react'

/**
 * AppHeader exibe um slot que cada página preenche via <PageHeader />.
 * No Frappe isso é feito via Teleport para #app-header; aqui usamos id+portal pattern
 * implementado pelo componente <PageHeader> que renderiza dentro de #app-header.
 */
export function AppHeader({ rightSlot }: { rightSlot?: ReactNode }) {
  return (
    <div className="flex border-b border-gray-200 bg-background">
      <div id="app-header" className="flex-1 w-full" />
      <div className="flex items-center justify-center pr-3">{rightSlot}</div>
    </div>
  )
}
