import { Button } from '@/components/ui/button'
import type { FilterOption } from '../hooks/useVisibleNodes'
import {
  useMetricsStore,
  selectActiveNodes,
  selectCriticalCount,
  selectOkCount,
  selectWarningCount,
} from '../stores/metricsStore'

interface NodeFiltersProps {
  activeFilter: FilterOption
  onFilterChange: (filter: FilterOption) => void
}

// Reads the counts itself so the parent does not re-render when they change
export function NodeFilters({ activeFilter, onFilterChange }: NodeFiltersProps) {
  const total = useMetricsStore(selectActiveNodes)
  const ok = useMetricsStore(selectOkCount)
  const warning = useMetricsStore(selectWarningCount)
  const critical = useMetricsStore(selectCriticalCount)

  const filters: { label: string; value: FilterOption; count: number }[] = [
    { label: 'All', value: 'ALL', count: total },
    { label: 'OK', value: 'OK', count: ok },
    { label: 'Warning', value: 'WARNING', count: warning },
    { label: 'Critical', value: 'CRITICAL', count: critical },
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
