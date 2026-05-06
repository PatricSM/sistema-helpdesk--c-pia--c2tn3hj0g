import { ReactNode } from 'react'
import { LifeBuoy } from 'lucide-react'

interface PageTitleProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  rightSlot?: ReactNode
  leftSlot?: ReactNode
  hideIcon?: boolean
}

/**
 * Cabeçalho de página injetado no slot #app-header pelo PageHeader.
 * Estilo Frappe: h-12 (48px), texto base/semibold, ícone pequeno
 * cinza, sem destaque colorido (apenas o título tem peso visual).
 */
export function PageTitle({
  title,
  icon: Icon = LifeBuoy,
  rightSlot,
  leftSlot,
  hideIcon,
}: PageTitleProps) {
  return (
    <div className="flex items-center justify-between h-12 px-4 w-full">
      <div className="flex items-center gap-2 min-w-0">
        {leftSlot}
        {!hideIcon && <Icon className="h-4 w-4 text-gray-500 shrink-0" />}
        <h1 className="text-[15px] font-semibold tracking-tight truncate text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{rightSlot}</div>
    </div>
  )
}
