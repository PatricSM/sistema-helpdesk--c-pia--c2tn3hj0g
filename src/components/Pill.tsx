import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PillProps {
  label: ReactNode
  color?: string
  bullet?: boolean
  variant?: 'subtle' | 'outline' | 'solid'
  className?: string
}

const COLOR_MAP: Record<string, { bg: string; text: string; bullet: string; border: string }> = {
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    bullet: 'bg-red-500',
    border: 'border-red-200',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    bullet: 'bg-orange-500',
    border: 'border-orange-200',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    bullet: 'bg-amber-500',
    border: 'border-amber-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    bullet: 'bg-yellow-500',
    border: 'border-yellow-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    bullet: 'bg-green-500',
    border: 'border-green-200',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    bullet: 'bg-blue-500',
    border: 'border-blue-200',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    bullet: 'bg-violet-500',
    border: 'border-violet-200',
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    bullet: 'bg-gray-400',
    border: 'border-gray-200',
  },
}

export function Pill({
  label,
  color = 'gray',
  bullet = false,
  variant = 'subtle',
  className,
}: PillProps) {
  const c = COLOR_MAP[color] || COLOR_MAP.gray
  const variantClass =
    variant === 'outline'
      ? `bg-white border ${c.border} ${c.text}`
      : variant === 'solid'
        ? `${c.bullet} text-white`
        : `${c.bg} ${c.text}`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap leading-tight',
        variantClass,
        className,
      )}
    >
      {bullet && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', c.bullet)} />}
      {label}
    </span>
  )
}
