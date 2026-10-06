import { useState } from 'react'
import type { MetricDataPoint, NodeMetric } from '../types/metrics'

const MAX_POINTS = 20

interface History {
  nodeId: string | null
  points: MetricDataPoint[]
}

// Keeps the last MAX_POINTS readings of the selected node, for the live chart.
// History restarts when a different node is selected.
export function useNodeHistory(node: NodeMetric | null): MetricDataPoint[] {
  const [history, setHistory] = useState<History>({ nodeId: null, points: [] })
  const [lastNode, setLastNode] = useState<NodeMetric | null>(null)

  // Adjust state while rendering (React-endorsed) instead of in an effect: no extra commit per update
  if (node !== lastNode) {
    setLastNode(node)
    if (node) {
      const point = {
        timestamp: node.timestamp,
        cpu: node.cpu,
        memory: node.memory,
        latency: node.latency,
      }
      const base = history.nodeId === node.nodeId ? history.points : []
      // New array each time: Recharts freezes the array it receives
      setHistory({ nodeId: node.nodeId, points: [...base.slice(-(MAX_POINTS - 1)), point] })
    } else {
      // Deselected: drop the old readings so reopening the same node starts fresh
      setHistory({ nodeId: null, points: [] })
    }
  }

  return node && history.nodeId === node.nodeId ? history.points : []
}
