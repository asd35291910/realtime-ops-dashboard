import { useState } from 'react'
import { useMetricsConnection } from './hooks/useMetricsConnection'
import { useNodeSelection } from './hooks/useNodeSelection'
import { useVisibleNodes, type FilterOption } from './hooks/useVisibleNodes'
import { useMetricsStore, selectActiveNodes } from './stores/metricsStore'
import { MetricsOverview } from './components/MetricsOverview'
import { NodeList } from './components/NodeList'
import { NodeFilters } from './components/NodeFilters'
import { NodeSort, type SortOption } from './components/NodeSort'
import { NodeDetail } from './components/NodeDetail'
import { ConnectionBanner } from './components/ConnectionBanner'

// The browser connects to the mock server, so in Docker this must be a host-reachable URL.
// Override it with VITE_WS_URL at build time; the default is for local development.
const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:3001'

function App() {
  const connectionStatus = useMetricsConnection(WS_URL)

  const nodes = useMetricsStore((state) => state.nodes)
  const totalNodes = useMetricsStore(selectActiveNodes)

  // Local UI state: filter and sort
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL')
  const [activeSort, setActiveSort] = useState<SortOption>('nodeId')

  const visibleNodes = useVisibleNodes(nodes, activeFilter, activeSort)
  const { selectedNode, history, select, clear } = useNodeSelection(nodes)

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Real-Time Operational Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring {totalNodes} nodes with live metrics
          </p>
        </div>

        <ConnectionBanner status={connectionStatus} />

        <MetricsOverview />

        <div className="flex items-center justify-between gap-4">
          <NodeFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <NodeSort activeSort={activeSort} onSortChange={setActiveSort} />
        </div>

        <NodeList nodes={visibleNodes} onNodeSelect={select} selectedNodeId={selectedNode?.nodeId} />

        <NodeDetail node={selectedNode} onClose={clear} historyData={history} />
      </div>
    </div>
  )
}

export default App
