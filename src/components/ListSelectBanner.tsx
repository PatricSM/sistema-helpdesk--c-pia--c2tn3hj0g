import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SelectBannerAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'destructive'
}

export function ListSelectBanner({
  count,
  actions = [],
  onClear,
  className,
}: {
  count: number
  actions?: SelectBannerAction[]
  onClear: () => void
  className?: string
}) {
  if (count === 0) return null
  return (
    <div
      className={cn('flex items-center justify-between px-5 py-2 border-b bg-gray-50', className)}
    >
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
        <span className="font-medium">
          {count} selecionado{count > 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant={a.variant === 'destructive' ? 'ghost' : 'ghost'}
            size="sm"
            className={cn(
              'h-7 gap-1.5 text-xs',
              a.variant === 'destructive' && 'text-destructive hover:text-destructive',
            )}
            onClick={a.onClick}
          >
            {a.icon && <a.icon className="h-3.5 w-3.5" />}
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export type { SelectBannerAction }

// Para uso fora deste componente
export type ReactNodeAlias = ReactNode
