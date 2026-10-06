import type { NodeStatus } from '../../../types/metrics'

/**
 * Derives status from metrics. Leaving a status needs lower values than
 * entering it (hysteresis), so nodes do not flap around a threshold.
 */
export function deriveStatus(
  prev: NodeStatus,
  cpu: number,
  memory: number,
  latency: number,
): NodeStatus {
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
