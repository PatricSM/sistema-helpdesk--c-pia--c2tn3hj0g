import { ReactNode } from 'react'

interface SettingsLayoutBaseProps {
  title: string
  description?: string
  headerActions?: ReactNode
  headerBottom?: ReactNode
  children: ReactNode
}

/**
 * Layout das subseções de Settings — header com title/description e ações,
 * seguido por content com padding generoso. Equivalente ao SettingsLayoutBase
 * do Frappe Helpdesk.
 */
export function SettingsLayoutBase({
  title,
  description,
  headerActions,
  headerBottom,
  children,
}: SettingsLayoutBaseProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {description && <p className="text-sm text-gray-600 max-w-md">{description}</p>}
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
        {headerBottom && <div className="mt-6">{headerBottom}</div>}
      </div>
      <div className="px-8 pb-8 overflow-y-auto flex-1 flex flex-col">{children}</div>
    </div>
  )
}
