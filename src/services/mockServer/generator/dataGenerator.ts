import type { NodeMetric, NodeStatus } from '../../../types/metrics'
import { anomalies, applySpike, maybeStartAnomaly } from './anomalies'
import { deriveStatus } from './nodeStatus'
import { clamp, randomDelta, randomInRange } from './random'

interface Baseline {
  cpu: number
  memory: number
  latency: number
}

// Per-node "healthy" values the metrics drift around (not sent to clients)
const baselines = new Map<string, Baseline>()

const NO_CHANGE_TICK_CHANCE = 0.05
const MAX_CHANGED_FRACTION = 0.5

/**
 * Creates the initial nodes: ~80% OK, ~15% WARNING, ~5% CRITICAL
 */
export function generateNodes(count: number): NodeMetric[] {
  baselines.clear()
  anomalies.clear()

  const nodes: NodeMetric[] = []

  for (let i = 0; i < count; i++) {
    const nodeId = `node-${String(i + 1).padStart(3, '0')}`
    const rand = Math.random()
    const isOk = rand < 0.8
    const isWarning = !isOk && rand < 0.95

    const baseline: Baseline = isOk
      ? {
          cpu: randomInRange(25, 45),
          memory: randomInRange(35, 55),
          latency: randomInRange(30, 80),
        }
      : {
          // WARNING band; CRITICAL nodes start in an incident and recover to it
          cpu: randomInRange(72, 77),
          memory: randomInRange(72, 77),
          latency: randomInRange(210, 240),
        }
    baselines.set(nodeId, baseline)

    let { cpu, latency } = baseline
    let status: NodeStatus = isOk ? 'OK' : 'WARNING'

    if (!isOk && !isWarning) {
      status = 'CRITICAL'
      cpu = randomInRange(88, 95)
      latency = randomInRange(310, 350)
      anomalies.set(nodeId, { kind: 'cpu', spiked: true, hold: randomInRange(2, 5) })
    }

    nodes.push({
      nodeId,
      status,
      cpu,
      memory: baseline.memory,
      latency,
      timestamp: Date.now(),
    })
  }

  return nodes
}

/**
 * Computes the next metrics of a node that was selected for an update
 */
function updateNode(node: NodeMetric): NodeMetric {
  const baseline = baselines.get(node.nodeId)
  const anomaly = anomalies.get(node.nodeId)
  if (!baseline) return node

  let cpu = node.cpu
  let memory = node.memory
  let latency = node.latency

  if (anomaly && !anomaly.spiked) {
    anomaly.spiked = true
    ;({ cpu, latency } = applySpike(node, anomaly.kind, baseline.latency))
  } else if (anomaly && anomaly.hold > 0) {
    // Incident in progress: values stay high with a little noise
    anomaly.hold--
    cpu += randomDelta(1, 3)
    latency += randomDelta(5, 10)
  } else if (anomaly) {
    // Gradual recovery towards the baseline
    cpu += Math.round((baseline.cpu - cpu) * 0.3)
    memory += Math.round((baseline.memory - memory) * 0.3)
    latency += Math.round((baseline.latency - latency) * 0.3)

    const recovered =
      Math.abs(cpu - baseline.cpu) <= 3 &&
      Math.abs(memory - baseline.memory) <= 3 &&
      Math.abs(latency - baseline.latency) <= 15
    if (recovered) anomalies.delete(node.nodeId)
  } else {
    // Normal drift: small random steps with a light pull to the baseline
    cpu += randomDelta(1, 5) + Math.round((baseline.cpu - cpu) * 0.1)
    memory += randomDelta(1, 3) + Math.round((baseline.memory - memory) * 0.1)
    latency += randomDelta(5, 20) + Math.round((baseline.latency - latency) * 0.1)
  }

  cpu = clamp(cpu, 0, 100)
  memory = clamp(memory, 0, 100)
  latency = clamp(latency, 0, 500)

  return {
    ...node,
    cpu,
    memory,
    latency,
    status: deriveStatus(node.status, cpu, memory, latency),
    timestamp: Date.now(),
  }
}

/**
 * Simulates one tick: only a few nodes change, the rest keep the exact same
 * object (values and timestamp), so clients can skip them.
 */
export function updateNodeMetrics(nodes: NodeMetric[]): NodeMetric[] {
  // Some ticks have no changes at all
  if (nodes.length === 0 || Math.random() < NO_CHANGE_TICK_CHANCE) return nodes

  maybeStartAnomaly(nodes)

  const selected = new Set<string>(anomalies.keys())
  const maxChanged = Math.ceil(nodes.length * MAX_CHANGED_FRACTION)
  const target = Math.min(nodes.length, selected.size + randomInRange(1, maxChanged))
  while (selected.size < target) {
    selected.add(nodes[randomInRange(0, nodes.length - 1)].nodeId)
  }

  return nodes.map((node) => (selected.has(node.nodeId) ? updateNode(node) : node))
}
