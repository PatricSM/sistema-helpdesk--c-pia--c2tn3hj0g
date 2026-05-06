import { ReactNode, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SidebarSection({
  label,
  hideLabel,
  defaultOpen = true,
  isExpanded,
  children,
}: {
  label: string
  hideLabel?: boolean
  defaultOpen?: boolean
  isExpanded: boolean
  children: ReactNode
}) {
  const [opened, setOpened] = useState(defaultOpen)
  const isOpen = !isExpanded ? true : opened

  return (
    <div>
      {!hideLabel && (
        <div
          className={cn(
            'flex cursor-pointer gap-1.5 px-2 mx-2 text-base font-medium text-gray-600 transition-all duration-300 ease-in-out',
            !isExpanded
              ? 'ml-0 h-0 overflow-hidden opacity-0'
              : 'pt-[11px] pb-2.5 w-auto opacity-100',
          )}
          onClick={() => setOpened((v) => !v)}
        >
          <ChevronRight
            className={cn('h-4 w-4 text-gray-700 transition-all duration-300', {
              'rotate-90': isOpen,
            })}
          />
          <span className="text-sm">{label}</span>
        </div>
      )}
      {isOpen && <nav className="flex flex-col">{children}</nav>}
    </div>
  )
}
