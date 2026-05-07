import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'
import { getEmailLogsList, getEmailLogStats, EmailLogFilters } from '@/services/email_log'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function SettingsEmailLog() {
  const [stats, setStats] = useState({ totalSent: 0, deliveredPercentage: 0, bouncedPercentage: 0 })
  const [logs, setLogs] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<EmailLogFilters>({ direction: 'all', status: 'all' })

  useEffect(() => {
    getEmailLogStats().then(setStats).catch(console.error)
  }, [])

  useEffect(() => {
    getEmailLogsList(page, filters)
      .then((res) => {
        setLogs(res.items)
        setTotalPages(res.totalPages)
      })
      .catch(console.error)
  }, [page, filters])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium">Logs de Email</h2>
        <p className="text-sm text-muted-foreground">
          Monitore o tráfego de emails de entrada e saída nos últimos 30 dias.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Enviado</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.totalSent}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Taxa de Entrega</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.deliveredPercentage.toFixed(1)}%</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Taxa de Rejeição (Bounce)</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.bouncedPercentage.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Select
          value={filters.direction}
          onValueChange={(v) => {
            setFilters({ ...filters, direction: v })
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Direção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Direções</SelectItem>
            <SelectItem value="in">Entrada</SelectItem>
            <SelectItem value="out">Saída</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => {
            setFilters({ ...filters, status: v })
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="queued">Na Fila</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="bounced">Rejeitado</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Dir</TableHead>
              <TableHead>Para</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {log.direction === 'in' ? (
                    <ArrowDownLeft className="w-4 h-4 text-blue-500" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={log.to}>
                  {log.to || '-'}
                </TableCell>
                <TableCell className="max-w-[250px] truncate" title={log.subject}>
                  {log.subject || '(Sem Assunto)'}
                </TableCell>
                <TableCell>
                  {log.ticket ? (
                    <Link to={`/tickets/${log.ticket}`} className="text-blue-500 hover:underline">
                      #{log.expand?.ticket?.id?.slice(0, 8) || log.ticket.slice(0, 8)}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.status === 'delivered' || log.status === 'sent'
                        ? 'default'
                        : log.status === 'bounced' || log.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {log.status || 'desconhecido'}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  )
}
