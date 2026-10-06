import { useState, useMemo } from 'react'
import { useMetricsConnection } from './hooks/useMetricsConnection'
import { useNodeHistory } from './hooks/useNodeHistory'
import { useVisibleNodes, type FilterOption } from './hooks/useVisibleNodes'
import {
  useMetricsStore,
  selectActiveNodes,
  selectCriticalCount,
  selectWarningCount,
  selectOkCount,
} from './stores/metricsStore'
import { MetricsOverview } from './components/MetricsOverview'
import { NodeList } from './components/NodeList'
import { NodeFilters } from './components/NodeFilters'
import { NodeSort, type SortOption } from './components/NodeSort'
import { NodeDetail } from './components/NodeDetail'
import type { NodeMetric } from './types/metrics'

// The browser connects to the mock server, so in Docker this must be a host-reachable URL.
// Override it with VITE_WS_URL at build time; the default is for local development.
const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:3001'

function App() {
  useMetricsConnection(WS_URL)

  const nodes = useMetricsStore((state) => state.nodes)
  const totalNodes = useMetricsStore(selectActiveNodes)
  const criticalCount = useMetricsStore(selectCriticalCount)
  const warningCount = useMetricsStore(selectWarningCount)
  const okCount = useMetricsStore(selectOkCount)

  // Local UI state: filter, sort and selection
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL')
  const [activeSort, setActiveSort] = useState<SortOption>('nodeId')
  // Keep only the id: the node itself is read from the store so the modal stays live
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const selectedNode = useMemo(
    () => nodes.find((n) => n.nodeId === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )
  const selectedNodeHistory = useNodeHistory(selectedNode)
  const visibleNodes = useVisibleNodes(nodes, activeFilter, activeSort)

  const handleNodeSelect = (node: NodeMetric) => {
    setSelectedNodeId(node.nodeId)
    setIsDetailOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Real-Time Operational Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring {totalNodes} nodes with live metrics
          </p>
        </div>

        <MetricsOverview />

        <div className="flex items-center justify-between gap-4">
          <NodeFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={{
              all: totalNodes,
              ok: okCount,
              warning: warningCount,
              critical: criticalCount,
            }}
          />
          <NodeSort activeSort={activeSort} onSortChange={setActiveSort} />
        </div>

        <NodeList
          nodes={visibleNodes}
          onNodeSelect={handleNodeSelect}
          selectedNodeId={selectedNode?.nodeId}
        />

        <NodeDetail
          node={selectedNode}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          historyData={selectedNodeHistory}
        />
      </div>
    </div>
  )
}

export default App
