import { useCallback, useMemo, useState } from 'react'
import type { NodeMetric } from '../types/metrics'
import { useNodeHistory } from './useNodeHistory'

// Selected node for the detail modal. The modal is open while a node is selected.
export function useNodeSelection(nodes: NodeMetric[]) {
  // Keep only the id: the node itself is read from the list so the modal stays live
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const selectedNode = useMemo(
    () => nodes.find((n) => n.nodeId === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )
  const history = useNodeHistory(selectedNode)

  // Stable references so memoized rows and the Escape listener are not reset on every render
  const select = useCallback((node: NodeMetric) => setSelectedNodeId(node.nodeId), [])
  const clear = useCallback(() => setSelectedNodeId(null), [])

  return { selectedNode, history, select, clear }
}
