import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarItem {
  id: string
  name?: string
  image?: string
}

export function MultipleAvatar({
  avatars,
  size = 24,
  max = 3,
  className,
}: {
  avatars: AvatarItem[]
  size?: number
  max?: number
  className?: string
}) {
  const visible = avatars.slice(0, max)
  const overflow = avatars.length - visible.length
  const sizePx = `${size}px`

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visible.map((a) => (
        <Avatar
          key={a.id}
          className="border-2 border-white"
          style={{ width: sizePx, height: sizePx }}
        >
          <AvatarImage src={a.image || `https://img.usecurling.com/ppl/thumbnail?seed=${a.id}`} />
          <AvatarFallback className="text-[10px]">{a.name?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <div
          className="rounded-full bg-gray-200 text-gray-700 text-[10px] font-medium flex items-center justify-center border-2 border-white"
          style={{ width: sizePx, height: sizePx }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
