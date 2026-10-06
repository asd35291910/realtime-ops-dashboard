import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Badge } from '@/components/ui/badge'
import type { NodeMetric } from '../types/metrics'

interface NodeListProps {
  nodes: NodeMetric[]
  onNodeSelect?: (node: NodeMetric) => void
  selectedNodeId?: string
}

// Fixed row height (h-9) so the virtualizer can compute positions without measuring
const ROW_HEIGHT = 36

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
  const scrollRef = useRef<HTMLDivElement>(null)

  // Only the rows near the viewport are mounted; the rest do not exist in the DOM
  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })
  const virtualRows = virtualizer.getVirtualItems()
  // Spacer rows keep the scrollbar size and position as if all rows were rendered
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualRows.length > 0 ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0

  return (
    // Fixed max height: the list scrolls inside, the header stays visible
    <div ref={scrollRef} className="max-h-[32rem] overflow-auto rounded-lg border border-border bg-card">
      <table className="w-full table-fixed text-sm min-w-[32rem]">
        {/* Sticky needs an opaque background, or rows show through while scrolling */}
        <thead className="sticky top-0 z-10 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
          <tr className="text-left">
            <th className="px-4 py-2 font-medium">Node</th>
            <th className="w-32 px-4 py-2 font-medium">Status</th>
            <th className="w-24 px-4 py-2 font-medium text-right">CPU</th>
            <th className="w-24 px-4 py-2 font-medium text-right">Memory</th>
            <th className="w-24 px-4 py-2 font-medium text-right">Latency</th>
          </tr>
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr aria-hidden style={{ height: paddingTop }}>
              <td colSpan={5} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const node = nodes[virtualRow.index]
            return (
            <tr
              key={node.nodeId}
              style={{ height: ROW_HEIGHT }}
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
            )
          })}
          {paddingBottom > 0 && (
            <tr aria-hidden style={{ height: paddingBottom }}>
              <td colSpan={5} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
