import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NodeMetric } from '../../../types/metrics'
import { generateNodes, updateNodeMetrics } from './dataGenerator'

const TICKS = 300

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generateNodes', () => {
  it('creates the requested number of nodes with unique ids', () => {
    const nodes = generateNodes(50)
    expect(nodes).toHaveLength(50)
    expect(new Set(nodes.map((n) => n.nodeId)).size).toBe(50)
  })

  it('keeps every metric inside its valid range', () => {
    for (const node of generateNodes(200)) {
      expect(node.cpu).toBeGreaterThanOrEqual(0)
      expect(node.cpu).toBeLessThanOrEqual(100)
      expect(node.memory).toBeGreaterThanOrEqual(0)
      expect(node.memory).toBeLessThanOrEqual(100)
      expect(node.latency).toBeGreaterThanOrEqual(0)
    }
  })

  it('starts with most nodes OK', () => {
    const nodes = generateNodes(500)
    const ok = nodes.filter((n) => n.status === 'OK').length
    expect(ok / nodes.length).toBeGreaterThan(0.65)
  })
})

describe('updateNodeMetrics', () => {
  it('returns the same array when the tick has no changes', () => {
    const nodes = generateNodes(50)
    // 0 is below NO_CHANGE_TICK_CHANCE, so this tick skips every update
    vi.spyOn(Math, 'random').mockReturnValue(0)

    expect(updateNodeMetrics(nodes)).toBe(nodes)
  })

  it('keeps the same object, values and timestamp for nodes it did not update', () => {
    let nodes = generateNodes(50)
    let untouched = 0

    for (let tick = 0; tick < TICKS; tick++) {
      const next = updateNodeMetrics(nodes)
      next.forEach((node, i) => {
        if (node === nodes[i]) {
          untouched++
          expect(node.timestamp).toBe(nodes[i].timestamp)
        }
      })
      nodes = next
    }

    expect(untouched).toBeGreaterThan(0)
  })

  it('only gives a new timestamp to nodes that changed', () => {
    vi.useFakeTimers()
    try {
      let nodes = generateNodes(50)
      for (let tick = 1; tick <= TICKS; tick++) {
        vi.setSystemTime(tick * 1000)
        const previous = nodes
        nodes = updateNodeMetrics(nodes)
        nodes.forEach((node, i) => {
          if (node !== previous[i]) expect(node.timestamp).toBe(tick * 1000)
        })
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('updates only a subset of the nodes in each tick', () => {
    let nodes = generateNodes(50)

    for (let tick = 0; tick < TICKS; tick++) {
      const previous = nodes
      nodes = updateNodeMetrics(nodes)
      const changed = nodes.filter((node, i) => node !== previous[i]).length
      // MAX_CHANGED_FRACTION is 0.5; anomalies in progress can add a few more
      expect(changed).toBeLessThan(50)
    }
  })

  it('keeps the node ids and the node count', () => {
    const nodes = generateNodes(50)
    const next = updateNodeMetrics(nodes)
    expect(next.map((n) => n.nodeId)).toEqual(nodes.map((n) => n.nodeId))
  })

  it('keeps metrics within range after many ticks', () => {
    let nodes = generateNodes(50)
    for (let tick = 0; tick < TICKS; tick++) nodes = updateNodeMetrics(nodes)

    for (const node of nodes) {
      expect(node.cpu).toBeGreaterThanOrEqual(0)
      expect(node.cpu).toBeLessThanOrEqual(100)
      expect(node.memory).toBeGreaterThanOrEqual(0)
      expect(node.memory).toBeLessThanOrEqual(100)
      expect(node.latency).toBeGreaterThanOrEqual(0)
      expect(node.latency).toBeLessThanOrEqual(500)
    }
  })

  it('recovers from CRITICAL through WARNING, never straight to OK', () => {
    let nodes: NodeMetric[] = generateNodes(50)

    for (let tick = 0; tick < TICKS; tick++) {
      const previous = nodes
      nodes = updateNodeMetrics(nodes)
      nodes.forEach((node, i) => {
        expect(previous[i].status === 'CRITICAL' && node.status === 'OK').toBe(false)
      })
    }
  })
})
