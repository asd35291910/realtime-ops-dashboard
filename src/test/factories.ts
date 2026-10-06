import type { NodeMetric } from '../types/metrics'

// Builds a node with healthy defaults; tests override only what they care about
export function makeNode(overrides: Partial<NodeMetric> = {}): NodeMetric {
  return {
    nodeId: 'node-001',
    status: 'OK',
    cpu: 30,
    memory: 40,
    latency: 50,
    timestamp: 1000,
    ...overrides,
  }
}
