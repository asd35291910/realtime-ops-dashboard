import type { NodeMetric, NodeStatus } from '../../types/metrics'

/**
 * Genera un status aleatorio con distribución realista:
 * ~70% OK, ~20% WARNING, ~10% CRITICAL
 */
function randomStatus(): NodeStatus {
  const rand = Math.random()
  if (rand < 0.7) return 'OK'
  if (rand < 0.9) return 'WARNING'
  return 'CRITICAL'
}

/**
 * Genera un valor aleatorio entre min y max
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Genera un conjunto inicial de nodos con métricas aleatorias
 */
export function generateNodes(count: number): NodeMetric[] {
  const nodes: NodeMetric[] = []

  for (let i = 0; i < count; i++) {
    const status = randomStatus()

    // Nodos CRITICAL tienen métricas más altas
    const cpuBase = status === 'CRITICAL' ? 80 : status === 'WARNING' ? 60 : 30
    const memoryBase = status === 'CRITICAL' ? 85 : status === 'WARNING' ? 65 : 40
    const latencyBase = status === 'CRITICAL' ? 300 : status === 'WARNING' ? 150 : 50

    nodes.push({
      nodeId: `node-${String(i + 1).padStart(3, '0')}`,
      status,
      cpu: Math.min(100, cpuBase + randomInRange(-10, 15)),
      memory: Math.min(100, memoryBase + randomInRange(-10, 15)),
      latency: Math.max(0, latencyBase + randomInRange(-30, 50)),
      timestamp: Date.now(),
    })
  }

  return nodes
}

/**
 * Actualiza las métricas de los nodos existentes simulando variaciones realistas
 */
export function updateNodeMetrics(nodes: NodeMetric[]): NodeMetric[] {
  return nodes.map((node) => {
    // Pequeña variación en CPU/Memory
    let cpu = node.cpu + randomInRange(-5, 5)
    let memory = node.memory + randomInRange(-3, 3)
    let latency = node.latency + randomInRange(-20, 20)

    // Clamp values
    cpu = Math.max(0, Math.min(100, cpu))
    memory = Math.max(0, Math.min(100, memory))
    latency = Math.max(0, Math.min(500, latency))

    // Actualizar status basado en las métricas actuales
    let status: NodeStatus = 'OK'
    if (cpu > 80 || memory > 80 || latency > 250) {
      status = 'CRITICAL'
    } else if (cpu > 60 || memory > 60 || latency > 150) {
      status = 'WARNING'
    }

    // 5% chance de spike random en latencia (simula problemas de red)
    if (Math.random() < 0.05) {
      latency = randomInRange(200, 400)
    }

    return {
      ...node,
      cpu,
      memory,
      latency,
      status,
      timestamp: Date.now(),
    }
  })
}
