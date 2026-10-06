import { Badge } from '@/components/ui/badge'
import type { NodeMetric } from '../types/metrics'

interface NodeListProps {
  nodes: NodeMetric[]
  onNodeSelect?: (node: NodeMetric) => void
  selectedNodeId?: string
}

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

export function NodeList({ nodes, onNodeSelect, selectedNodeId }: NodeListProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <table className="w-full table-fixed text-sm min-w-[32rem]">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr className="text-left">
            <th className="px-4 py-2 font-medium">Node</th>
            <th className="w-32 px-4 py-2 font-medium">Status</th>
            <th className="w-24 px-4 py-2 font-medium text-right">CPU</th>
            <th className="w-24 px-4 py-2 font-medium text-right">Memory</th>
            <th className="w-24 px-4 py-2 font-medium text-right">Latency</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr
              key={node.nodeId}
              tabIndex={0}
              onClick={() => onNodeSelect?.(node)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onNodeSelect?.(node)
              }}
              className={`cursor-pointer border-t border-border hover:bg-muted/40 focus-visible:bg-muted/40 outline-none ${
                selectedNodeId === node.nodeId ? 'bg-muted/60' : ''
              }`}
            >
              <td className="px-4 py-1.5 font-mono">{node.nodeId}</td>
              <td className="px-4 py-1.5">
                <Badge variant={getStatusVariant(node.status)}>{node.status}</Badge>
              </td>
              <td className="px-4 py-1.5 text-right font-semibold tabular-nums">{node.cpu}%</td>
              <td className="px-4 py-1.5 text-right font-semibold tabular-nums">{node.memory}%</td>
              <td className="px-4 py-1.5 text-right font-semibold tabular-nums">{node.latency}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
