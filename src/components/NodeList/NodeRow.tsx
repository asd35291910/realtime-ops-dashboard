import { memo } from 'react'
import { StatusBadge } from '../StatusBadge'
import type { NodeMetric } from '../../types/metrics'

// Fixed row height (h-9) so the virtualizer can compute positions without measuring
export const ROW_HEIGHT = 36

interface NodeRowProps {
  node: NodeMetric
  isSelected: boolean
  onSelect?: (node: NodeMetric) => void
}

// memo: a row only re-renders when its own node, selection or handler changes
export const NodeRow = memo(function NodeRow({ node, isSelected, onSelect }: NodeRowProps) {
  return (
    <tr
      style={{ height: ROW_HEIGHT }}
      tabIndex={0}
      onClick={() => onSelect?.(node)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect?.(node)
      }}
      className={`cursor-pointer border-t border-border hover:bg-row-hover focus-visible:bg-row-hover outline-none ${
        isSelected ? 'bg-row-selected' : ''
      }`}
    >
      <td className="px-4 py-1.5 font-mono">{node.nodeId}</td>
      <td className="px-4 py-1.5">
        <StatusBadge status={node.status} />
      </td>
      <td className="px-4 py-1.5 text-right font-semibold tabular-nums">{node.cpu}%</td>
      <td className="px-4 py-1.5 text-right font-semibold tabular-nums">{node.memory}%</td>
      <td className="px-4 py-1.5 text-right font-semibold tabular-nums">{node.latency}ms</td>
    </tr>
  )
})
