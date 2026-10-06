import { Button } from '@/components/ui/button'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { MetricCard } from '@/components/ui/metric-card'
import { MetricsChart } from './MetricsChart'
import { StatusBadge } from './StatusBadge'
import { XIcon } from 'lucide-react'
import type { MetricDataPoint, NodeMetric } from '../types/metrics'

interface NodeDetailProps {
  node: NodeMetric | null // the modal is open while a node is selected
  onClose: () => void
  historyData: MetricDataPoint[]
}

export function NodeDetail({ node, onClose, historyData }: NodeDetailProps) {
  useEscapeKey(onClose, node !== null)

  if (!node) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="node-detail-title"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-xl shadow-lg overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 id="node-detail-title" className="font-mono text-lg font-semibold">{node.nodeId}</h2>
          <div className="flex items-center gap-4">
            <StatusBadge status={node.status} />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={onClose}
              className="h-8 w-8"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="CPU Usage" value={`${node.cpu}%`} />
            <MetricCard label="Memory Usage" value={`${node.memory}%`} />
            <MetricCard label="Latency" value={`${node.latency}ms`} />
          </div>

          {/* Historical Chart */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-medium mb-4">Historical Metrics</h3>
            {/* A line needs two points; with one, the chart would only show loose marks */}
            {historyData.length > 1 ? (
              <MetricsChart data={historyData} height={300} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                No historical data available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
