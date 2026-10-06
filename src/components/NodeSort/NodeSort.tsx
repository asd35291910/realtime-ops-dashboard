import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type SortOption = 'nodeId' | 'cpu' | 'memory' | 'latency'

interface NodeSortProps {
  activeSort: SortOption
  onSortChange: (sort: SortOption) => void
}

export function NodeSort({ activeSort, onSortChange }: NodeSortProps) {
  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Node ID', value: 'nodeId' },
    { label: 'CPU Usage', value: 'cpu' },
    { label: 'Memory Usage', value: 'memory' },
    { label: 'Latency', value: 'latency' },
  ]

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted-foreground">Sort by:</label>
      <Select
        value={activeSort}
        onValueChange={(value) => {
          if (value) onSortChange(value)
        }}
      >
        <SelectTrigger className="w-(--select-width)">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
