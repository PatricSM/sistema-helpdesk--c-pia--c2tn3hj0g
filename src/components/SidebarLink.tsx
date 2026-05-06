import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SidebarLinkProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  to?: string
  isActive?: boolean
  isExpanded: boolean
  onClick?: () => void
  rightSlot?: ReactNode
  className?: string
}

export function SidebarLink({
  icon: Icon,
  label,
  to,
  isActive,
  isExpanded,
  onClick,
  rightSlot,
  className,
}: SidebarLinkProps) {
  const location = useLocation()
  const active =
    isActive ??
    (to ? (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)) : false)

  const content = (
    <div
      className={cn(
        'flex py-[7px] mx-2 h-[30px] cursor-pointer items-center rounded pl-2 pr-2 text-gray-800 transition-all duration-300 ease-in-out',
        isExpanded ? 'w-auto' : 'w-8',
        active ? 'bg-white shadow-sm' : 'hover:bg-gray-100',
        className,
      )}
      onClick={onClick}
    >
      <span className="shrink-0 text-gray-700">
        <Icon className="h-4 w-4" />
      </span>
      <div
        className={cn(
          'ml-2 flex min-w-0 items-center justify-between text-sm transition-all duration-300 ease-in-out w-full',
          isExpanded ? 'opacity-100' : 'opacity-0 -z-50',
        )}
      >
        <span className="truncate">{label}</span>
        {rightSlot}
      </div>
    </div>
  )

  const wrapped = to ? (
    <Link to={to} className="block">
      {content}
    </Link>
  ) : (
    content
  )

  if (!isExpanded) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{wrapped}</div>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return wrapped
}
