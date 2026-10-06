import { useState, useMemo, useEffect, useRef } from 'react'
import { useMetricsConnection } from './hooks/useMetricsConnection'
import {
  useMetricsStore,
  selectActiveNodes,
  selectCriticalCount,
  selectWarningCount,
  selectOkCount,
  selectAverageLatency,
  selectAverageCpu,
  selectAverageMemory,
} from './stores/metricsStore'
import { NodeList } from './components/NodeList'
import { NodeFilters } from './components/NodeFilters'
import { NodeSort, type SortOption } from './components/NodeSort'
import { NodeDetail } from './components/NodeDetail'
import type { NodeMetric, NodeStatus } from './types/metrics'

type FilterOption = NodeStatus | 'ALL'

// The browser connects to the mock server, so in Docker this must be a host-reachable URL.
// Override it with VITE_WS_URL at build time; the default is for local development.
const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:3001'

function App() {
  // Connect to WebSocket server
  useMetricsConnection(WS_URL)

  // Get metrics from store
  const nodes = useMetricsStore((state) => state.nodes)
  const totalNodes = useMetricsStore(selectActiveNodes)
  const criticalCount = useMetricsStore(selectCriticalCount)
  const warningCount = useMetricsStore(selectWarningCount)
  const okCount = useMetricsStore(selectOkCount)
  const avgLatency = useMetricsStore(selectAverageLatency)
  const avgCpu = useMetricsStore(selectAverageCpu)
  const avgMemory = useMetricsStore(selectAverageMemory)

  // Local state for filtering, sorting, and selection
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL')
  const [activeSort, setActiveSort] = useState<SortOption>('nodeId')
  const [selectedNode, setSelectedNode] = useState<NodeMetric | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Store historical data for selected node (last 20 data points)
  const nodeHistoryRef = useRef<Map<string, Array<{
    timestamp: number
    cpu: number
    memory: number
    latency: number
  }>>>(new Map())

  // Update history when selected node changes (more efficient)
  useEffect(() => {
    if (!selectedNode) return

    const node = nodes.find(n => n.nodeId === selectedNode.nodeId)
    if (!node) return

    const prev = nodeHistoryRef.current.get(node.nodeId) || []
    const point = {
      timestamp: node.timestamp,
      cpu: node.cpu,
      memory: node.memory,
      latency: node.latency,
    }
    // New array each time: Recharts freezes the array it receives
    nodeHistoryRef.current.set(node.nodeId, [...prev.slice(-19), point])
  }, [selectedNode?.nodeId, nodes])

  // Filter nodes by status
  const filteredNodes = useMemo(() => {
    if (activeFilter === 'ALL') return nodes
    return nodes.filter(node => node.status === activeFilter)
  }, [nodes, activeFilter])

  // Sort nodes
  const sortedNodes = useMemo(() => {
    const sorted = [...filteredNodes]
    sorted.sort((a, b) => {
      switch (activeSort) {
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
  }, [filteredNodes, activeSort])

  const handleNodeSelect = (node: NodeMetric) => {
    setSelectedNode(node)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
  }

  const selectedNodeHistory = selectedNode
    ? nodeHistoryRef.current.get(selectedNode.nodeId) || []
    : []

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Real-Time Operational Dashboard</h1>
          <p className="text-muted-foreground">
            Monitoring {totalNodes} nodes with live metrics
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-muted-foreground text-sm mb-2">Total Nodes</div>
            <div className="text-3xl font-bold">{totalNodes}</div>
          </div>

          <div className="bg-card rounded-lg p-6 border-2 border-destructive/50">
            <div className="text-muted-foreground text-sm mb-2">Critical</div>
            <div className="text-3xl font-bold text-destructive">{criticalCount}</div>
          </div>

          <div className="bg-card rounded-lg p-6 border-2 border-yellow-500/50">
            <div className="text-muted-foreground text-sm mb-2">Warning</div>
            <div className="text-3xl font-bold text-yellow-500">{warningCount}</div>
          </div>

          <div className="bg-card rounded-lg p-6 border-2 border-green-500/50">
            <div className="text-muted-foreground text-sm mb-2">OK</div>
            <div className="text-3xl font-bold text-green-500">{okCount}</div>
          </div>
        </div>

        {/* Average Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-muted-foreground text-sm mb-2">Avg CPU</div>
            <div className="text-3xl font-bold">{avgCpu}%</div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-muted-foreground text-sm mb-2">Avg Memory</div>
            <div className="text-3xl font-bold">{avgMemory}%</div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-muted-foreground text-sm mb-2">Avg Latency</div>
            <div className="text-3xl font-bold">{avgLatency}ms</div>
          </div>
        </div>

        {/* Filters and Sort */}
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
          <NodeSort
            activeSort={activeSort}
            onSortChange={setActiveSort}
          />
        </div>

        {/* Nodes Grid */}
        <NodeList
          nodes={sortedNodes}
          onNodeSelect={handleNodeSelect}
          selectedNodeId={selectedNode?.nodeId}
        />

        {/* Node Detail Modal */}
        <NodeDetail
          node={selectedNode}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          historyData={selectedNodeHistory}
        />
      </div>
    </div>
  )
}

export default App
