import { Button } from '@/components/ui/button'
import type { NodeStatus } from '../types/metrics'

type FilterOption = NodeStatus | 'ALL'

interface NodeFiltersProps {
  activeFilter: FilterOption
  onFilterChange: (filter: FilterOption) => void
  counts: {
    all: number
    ok: number
    warning: number
    critical: number
  }
}

export function NodeFilters({ activeFilter, onFilterChange, counts }: NodeFiltersProps) {
  const filters: { label: string; value: FilterOption; count: number }[] = [
    { label: 'All', value: 'ALL', count: counts.all },
    { label: 'OK', value: 'OK', count: counts.ok },
    { label: 'Warning', value: 'WARNING', count: counts.warning },
    { label: 'Critical', value: 'CRITICAL', count: counts.critical },
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          variant={activeFilter === filter.value ? 'default' : 'outline'}
          size="sm"
        >
          {filter.label}
          <span className="ml-2 opacity-70">({filter.count})</span>
        </Button>
      ))}
    </div>
  )
}
