export type NodeStatus = 'OK' | 'WARNING' | 'CRITICAL'

export interface NodeMetric {
  nodeId: string
  status: NodeStatus
  cpu: number // 0-100
  memory: number // 0-100
  latency: number // ms
  timestamp: number
}

export interface MetricsSnapshot {
  nodes: NodeMetric[]
  timestamp: number
}

// One reading of a node, as plotted in the history chart
export interface MetricDataPoint {
  timestamp: number
  cpu: number
  memory: number
  latency: number
}
