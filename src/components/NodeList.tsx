import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { NodeRow, ROW_HEIGHT } from './NodeRow'
import type { NodeMetric } from '../types/metrics'

interface NodeListProps {
  nodes: NodeMetric[]
  onNodeSelect?: (node: NodeMetric) => void
  selectedNodeId?: string
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
              <NodeRow
                key={node.nodeId}
                node={node}
                isSelected={selectedNodeId === node.nodeId}
                onSelect={onNodeSelect}
              />
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
