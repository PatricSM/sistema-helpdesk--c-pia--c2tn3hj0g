import { ReactNode } from 'react'
import { Filter, ArrowUpDown, Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ListColumn } from './ListView'

export interface FilterDef {
  key: string
  label: string
  options: { value: string; label: string }[]
}

interface ListToolbarProps<T extends { id: string }> {
  leftSlot?: ReactNode
  filters?: FilterDef[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  sortableColumns?: { key: string; label: string }[]
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSortChange?: (key: string, dir: 'asc' | 'desc') => void
  columns?: ListColumn<T>[]
  onColumnVisibilityChange?: (key: string, hidden: boolean) => void
  rightSlot?: ReactNode
  rowCount?: number
  className?: string
}

export function ListToolbar<T extends { id: string }>({
  leftSlot,
  filters = [],
  filterValues = {},
  onFilterChange,
  sortableColumns = [],
  sortKey,
  sortDir = 'desc',
  onSortChange,
  columns = [],
  onColumnVisibilityChange,
  rightSlot,
  rowCount,
  className,
}: ListToolbarProps<T>) {
  const activeFilters = Object.values(filterValues).filter((v) => v && v !== 'all').length

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2 border-b border-gray-200 bg-white',
        className,
      )}
    >
      <div className="flex items-center gap-2">{leftSlot}</div>
      <div className="flex items-center gap-1.5">
        {rowCount !== undefined && (
          <span className="text-xs text-gray-500 mr-2">{rowCount} resultados</span>
        )}

        {filters.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-gray-700">
                <Filter className="h-3.5 w-3.5" />
                Filter
                {activeFilters > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-900 text-white text-[10px] h-4 w-4">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Filtros
                </p>
                {filters.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs">{f.label}</Label>
                    <Select
                      value={filterValues[f.key] || 'all'}
                      onValueChange={(v) => onFilterChange?.(f.key, v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {f.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {sortableColumns.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-gray-700">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ordenar
                </p>
                <Select value={sortKey} onValueChange={(v) => onSortChange?.(v, sortDir)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortableColumns.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={sortDir}
                  onValueChange={(v) =>
                    onSortChange?.(sortKey || sortableColumns[0].key, v as 'asc' | 'desc')
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascendente</SelectItem>
                    <SelectItem value="desc">Descendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {columns.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-gray-700">
                <Columns3 className="h-3.5 w-3.5" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-60 p-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Colunas
                </p>
                {columns.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 rounded px-1.5 py-1"
                  >
                    <Checkbox
                      checked={!c.hidden}
                      onCheckedChange={(checked) => onColumnVisibilityChange?.(c.key, !checked)}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {rightSlot}
      </div>
    </div>
  )
}
