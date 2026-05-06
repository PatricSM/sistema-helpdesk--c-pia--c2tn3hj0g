import { ReactNode, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface ListColumn<T> {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => ReactNode
  sortable?: boolean
  hidden?: boolean
}

interface ListViewProps<T extends { id: string }> {
  columns: ListColumn<T>[]
  rows: T[]
  selectable?: boolean
  selected?: Set<string>
  onSelectedChange?: (s: Set<string>) => void
  onRowClick?: (row: T) => void
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  emptyState?: ReactNode
  className?: string
}

export function ListView<T extends { id: string }>({
  columns,
  rows,
  selectable = false,
  selected,
  onSelectedChange,
  onRowClick,
  sortKey,
  sortDir,
  onSort,
  emptyState,
  className,
}: ListViewProps<T>) {
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set())
  const sel = selected ?? internalSelected
  const setSel = onSelectedChange ?? setInternalSelected

  const visibleColumns = columns.filter((c) => !c.hidden)
  const allSelected = rows.length > 0 && rows.every((r) => sel.has(r.id))
  const someSelected = !allSelected && rows.some((r) => sel.has(r.id))

  const toggleAll = () => {
    if (allSelected) {
      setSel(new Set())
    } else {
      setSel(new Set(rows.map((r) => r.id)))
    }
  }

  const toggleRow = (id: string) => {
    const next = new Set(sel)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSel(next)
  }

  return (
    <div className={cn('w-full', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-gray-500 font-medium">
            {selectable && (
              <th className="w-10 px-3 py-2.5">
                <Checkbox
                  checked={allSelected || (someSelected ? 'indeterminate' : false)}
                  onCheckedChange={toggleAll}
                  aria-label="Selecionar tudo"
                />
              </th>
            )}
            {visibleColumns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'font-medium px-3 py-2.5',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.align !== 'right' && col.align !== 'center' && 'text-left',
                  col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                )}
                style={col.width ? { width: col.width } : undefined}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable &&
                    sortKey === col.key &&
                    (sortDir === 'asc' ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="py-0">
                {emptyState}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-gray-100 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50/60',
                  sel.has(row.id) && 'bg-blue-50/40',
                )}
                onClick={(e) => {
                  // Evitar trigger ao clicar no checkbox
                  const target = e.target as HTMLElement
                  if (target.closest('[data-list-checkbox]')) return
                  onRowClick?.(row)
                }}
              >
                {selectable && (
                  <td className="px-3 py-3" data-list-checkbox>
                    <Checkbox
                      checked={sel.has(row.id)}
                      onCheckedChange={() => toggleRow(row.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Selecionar"
                    />
                  </td>
                )}
                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-3 align-middle',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : (((row as unknown as Record<string, unknown>)[col.key] as ReactNode) ??
                        '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
