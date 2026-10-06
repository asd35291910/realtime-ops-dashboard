import type { NodeMetric, NodeStatus } from '../../types/metrics'

interface Baseline {
  cpu: number
  memory: number
  latency: number
}

type AnomalyKind = 'latency' | 'cpu' | 'escalate'

interface Anomaly {
  kind: AnomalyKind
  spiked: boolean // false until the spike is applied on the node's next update
  hold: number // updates the spike lasts before recovery starts
}

// Per-node "healthy" values the metrics drift around (not sent to clients)
const baselines = new Map<string, Baseline>()
// Nodes in an incident: always updated until they recover to their baseline
const anomalies = new Map<string, Anomaly>()

const NO_CHANGE_TICK_CHANCE = 0.05
const MAX_CHANGED_FRACTION = 0.5
const ANOMALY_CHANCE = 0.08

/**
 * Returns a random integer between min and max (both included)
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Same as randomInRange but with a random sign
 */
function randomDelta(min: number, max: number): number {
  return (Math.random() < 0.5 ? -1 : 1) * randomInRange(min, max)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Derives status from metrics. Leaving a status needs lower values than
 * entering it (hysteresis), so nodes do not flap around a threshold.
 */
function deriveStatus(prev: NodeStatus, cpu: number, memory: number, latency: number): NodeStatus {
  const max = Math.max(cpu, memory)
  const enteredCritical = max > 85 || latency > 300
  const enteredWarning = max > 70 || latency > 200
  if (enteredCritical) return 'CRITICAL'

  // Recovery steps down one level at a time: CRITICAL -> WARNING -> OK
  if (prev === 'CRITICAL') {
    const stillCritical = max > 78 || latency > 260
    return stillCritical ? 'CRITICAL' : 'WARNING'
  }
  if (enteredWarning) return 'WARNING'
  if (prev === 'WARNING') {
    const stillWarning = max > 65 || latency > 170
    return stillWarning ? 'WARNING' : 'OK'
  }
  return 'OK'
}

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
 * Applies the one-off jump that starts an incident
 */
function applySpike(node: NodeMetric, kind: AnomalyKind, baseline: Baseline) {
  if (kind === 'latency') {
    return { cpu: node.cpu, latency: baseline.latency + randomInRange(150, 300) }
  }
  if (kind === 'escalate') {
    return { cpu: randomInRange(88, 95), latency: node.latency }
  }
  return { cpu: node.cpu + randomInRange(35, 50), latency: node.latency }
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
    ;({ cpu, latency } = applySpike(node, anomaly.kind, baseline))
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
 * Starts an incident on a random node that is not already in one
 */
function maybeStartAnomaly(nodes: NodeMetric[]) {
  if (Math.random() >= ANOMALY_CHANCE) return

  const node = nodes[randomInRange(0, nodes.length - 1)]
  if (anomalies.has(node.nodeId)) return

  const roll = Math.random()
  // Escalation only makes sense for a node that is already WARNING
  const kind: AnomalyKind =
    roll < 0.4 ? 'latency' : roll < 0.7 || node.status !== 'WARNING' ? 'cpu' : 'escalate'

  anomalies.set(node.nodeId, { kind, spiked: false, hold: randomInRange(4, 8) })
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
