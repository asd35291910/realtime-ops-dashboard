import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MetricsChart } from './MetricsChart'
import { XIcon } from 'lucide-react'
import type { NodeMetric } from '../types/metrics'

interface NodeDetailProps {
  node: NodeMetric | null
  isOpen: boolean
  onClose: () => void
  historyData: Array<{
    timestamp: number
    cpu: number
    memory: number
    latency: number
  }>
}

export function NodeDetail({ node, isOpen, onClose, historyData }: NodeDetailProps) {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen || !node) return null

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'destructive' as const
      case 'WARNING':
        return 'warning' as const
      case 'OK':
        return 'success' as const
      default:
        return 'secondary' as const
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-xl shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="font-mono text-lg font-semibold">{node.nodeId}</h2>
          <div className="flex items-center gap-4">
            <Badge variant={getStatusVariant(node.status)}>
              {node.status}
            </Badge>
            <Button
              variant="ghost"
              size="icon-sm"
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
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">CPU Usage</div>
              <div className="text-3xl font-bold">{node.cpu}%</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Memory Usage</div>
              <div className="text-3xl font-bold">{node.memory}%</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Latency</div>
              <div className="text-3xl font-bold">{node.latency}ms</div>
            </div>
          </div>

          {/* Historical Chart */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-medium mb-4">Historical Metrics</h3>
            {historyData.length > 0 ? (
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
