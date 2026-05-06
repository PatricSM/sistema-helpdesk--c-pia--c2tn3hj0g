import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, ArrowRight, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SettingsLayoutBase } from '@/components/SettingsLayoutBase'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getTeams, deleteTeam, TeamRecord } from '@/services/teams'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function SettingsTeams() {
  const [teams, setTeams] = useState<TeamRecord[]>([])
  const { toast } = useToast()

  const load = async () => {
    try {
      setTeams(await getTeams())
    } catch {
      // handled
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('teams', load)

  const handleDelete = async (id: string) => {
    try {
      await deleteTeam(id)
      toast({ title: 'Time removido!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao remover',
        description: getErrorMessage(err),
      })
    }
  }

  return (
    <SettingsLayoutBase
      title="Times"
      description="Agrupe agentes por especialidade ou função. A gestão completa fica em /teams."
      headerActions={
        <Button asChild className="gap-1.5" size="sm">
          <Link to="/teams">
            <Plus className="h-4 w-4" /> Gerenciar Times
          </Link>
        </Button>
      }
    >
      {teams.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {teams.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-9 w-9 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${t.color || '#6b7280'}20` }}
                  >
                    <Users className="h-4 w-4" style={{ color: t.color || '#6b7280' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    {t.description && (
                      <p className="text-xs text-gray-500 truncate">{t.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                    <Link to={`/teams/${t.id}`}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir time?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(t.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum time"
          description="Crie times para agrupar agentes por especialidade."
          action={
            <Button asChild className="gap-1.5" size="sm">
              <Link to="/teams">
                <Plus className="h-4 w-4" /> Criar primeiro time
              </Link>
            </Button>
          }
        />
      )}
    </SettingsLayoutBase>
  )
}
