import type { NodeMetric } from '../../../types/metrics'
import { randomInRange } from './random'

export type AnomalyKind = 'latency' | 'cpu' | 'escalate'

export interface Anomaly {
  kind: AnomalyKind
  spiked: boolean // false until the spike is applied on the node's next update
  hold: number // updates the spike lasts before recovery starts
}

const ANOMALY_CHANCE = 0.08

// Nodes in an incident: always updated until they recover to their baseline
export const anomalies = new Map<string, Anomaly>()

/**
 * Applies the one-off jump that starts an incident
 */
export function applySpike(node: NodeMetric, kind: AnomalyKind, baselineLatency: number) {
  if (kind === 'latency') {
    return { cpu: node.cpu, latency: baselineLatency + randomInRange(150, 300) }
  }
  if (kind === 'escalate') {
    return { cpu: randomInRange(88, 95), latency: node.latency }
  }
  return { cpu: node.cpu + randomInRange(35, 50), latency: node.latency }
}

/**
 * Starts an incident on a random node that is not already in one
 */
export function maybeStartAnomaly(nodes: NodeMetric[]) {
  if (Math.random() >= ANOMALY_CHANCE) return

  const node = nodes[randomInRange(0, nodes.length - 1)]
  if (anomalies.has(node.nodeId)) return

  const roll = Math.random()
  // Escalation only makes sense for a node that is already WARNING
  const kind: AnomalyKind =
    roll < 0.4 ? 'latency' : roll < 0.7 || node.status !== 'WARNING' ? 'cpu' : 'escalate'

  anomalies.set(node.nodeId, { kind, spiked: false, hold: randomInRange(4, 8) })
}
