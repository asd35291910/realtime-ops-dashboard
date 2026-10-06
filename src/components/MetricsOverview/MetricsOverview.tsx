import {
  useMetricsStore,
  selectActiveNodes,
  selectCriticalCount,
  selectWarningCount,
  selectOkCount,
  selectAverageLatency,
  selectAverageCpu,
  selectAverageMemory,
} from '../../stores/metricsStore'
import { StatsBar } from '@/components/ui/stats-bar'

// Reads the aggregate selectors itself so only this component re-renders when they change
export function MetricsOverview() {
  const totalNodes = useMetricsStore(selectActiveNodes)
  const criticalCount = useMetricsStore(selectCriticalCount)
  const warningCount = useMetricsStore(selectWarningCount)
  const okCount = useMetricsStore(selectOkCount)
  const avgCpu = useMetricsStore(selectAverageCpu)
  const avgMemory = useMetricsStore(selectAverageMemory)
  const avgLatency = useMetricsStore(selectAverageLatency)

  return (
    <StatsBar
      stats={[
        { label: 'Total nodes', value: totalNodes },
        { label: 'Critical', value: criticalCount, dotClass: 'bg-destructive' },
        { label: 'Warning', value: warningCount, dotClass: 'bg-warning' },
        { label: 'OK', value: okCount, dotClass: 'bg-success' },
        { label: 'Avg CPU', value: `${avgCpu}%` },
        { label: 'Avg memory', value: `${avgMemory}%` },
        { label: 'Avg latency', value: `${avgLatency}ms` },
      ]}
    />
  )
}
