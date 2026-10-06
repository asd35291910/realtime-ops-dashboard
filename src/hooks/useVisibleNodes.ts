import { useMemo } from 'react'
import type { SortOption } from '../components/NodeSort'
import type { NodeMetric, NodeStatus } from '../types/metrics'

export type FilterOption = NodeStatus | 'ALL'

// Applies the status filter, then the sort order, to the live node list
export function useVisibleNodes(
  nodes: NodeMetric[],
  filter: FilterOption,
  sort: SortOption,
): NodeMetric[] {
  const filtered = useMemo(
    () => (filter === 'ALL' ? nodes : nodes.filter((node) => node.status === filter)),
    [nodes, filter],
  )

  return useMemo(() => {
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      switch (sort) {
        case 'cpu':
          return b.cpu - a.cpu
        case 'memory':
          return b.memory - a.memory
        case 'latency':
          return b.latency - a.latency
        case 'nodeId':
        default:
          return a.nodeId.localeCompare(b.nodeId)
      }
    })
    return sorted
  }, [filtered, sort])
}
