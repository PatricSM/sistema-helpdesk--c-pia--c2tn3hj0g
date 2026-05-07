import { LogOut, User, BookOpen, LifeBuoy, Users, ChevronsUpDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  agent: 'Agente',
  client: 'Cliente',
}

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const isClient = user?.role === 'client'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'flex items-center gap-2 hover:bg-gray-100 transition-all',
            compact ? 'h-8 w-8 p-0 justify-center' : 'h-auto w-full justify-start px-2 py-1.5',
          )}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={`https://img.usecurling.com/ppl/thumbnail?seed=${user?.id}`} />
            <AvatarFallback className="text-xs">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          {!compact && (
            <>
              <span className="flex-1 truncate text-left text-sm font-medium">
                {user?.name || 'Conta'}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-gray-500" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium leading-none">{user?.name || 'Minha conta'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            {user?.role && (
              <p className="text-xs font-semibold text-primary mt-1 uppercase">
                {ROLE_LABEL[user.role] || user.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isClient && (
          <DropdownMenuItem
            onClick={() => window.open('/my-tickets', '_blank')}
            className="cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            Portal do cliente
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate('/help')} className="cursor-pointer">
          <LifeBuoy className="mr-2 h-4 w-4" />
          Suporte
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/help')} className="cursor-pointer">
          <BookOpen className="mr-2 h-4 w-4" />
          Documentação
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
