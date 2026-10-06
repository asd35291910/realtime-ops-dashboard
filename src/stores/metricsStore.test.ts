import { beforeEach, describe, expect, it } from 'vitest'
import { makeNode } from '../test/factories'
import {
  selectActiveNodes,
  selectAverageCpu,
  selectAverageLatency,
  selectAverageMemory,
  selectCriticalCount,
  selectOkCount,
  selectWarningCount,
  useMetricsStore,
} from './metricsStore'

describe('metricsStore', () => {
  beforeEach(() => {
    useMetricsStore.getState().reset()
  })

  describe('setNodes', () => {
    it('keeps the same object for a node whose timestamp did not change', () => {
      const original = makeNode({ nodeId: 'node-001', timestamp: 1000 })
      const copy = { ...original } // same data, new object, as JSON.parse would deliver it
      useMetricsStore.getState().setNodes([original])

      useMetricsStore.getState().setNodes([copy])

      const result = useMetricsStore.getState().nodes[0]
      expect(result).toBe(original)
      expect(result).not.toBe(copy)
    })

    it('uses the new object for a node whose timestamp changed', () => {
      useMetricsStore.getState().setNodes([makeNode({ nodeId: 'node-001', cpu: 30, timestamp: 1000 })])
      const updated = makeNode({ nodeId: 'node-001', cpu: 55, timestamp: 2000 })

      useMetricsStore.getState().setNodes([updated])

      expect(useMetricsStore.getState().nodes[0]).toBe(updated)
    })

    it('only replaces the nodes that changed', () => {
      const a = makeNode({ nodeId: 'node-001', timestamp: 1000 })
      const b = makeNode({ nodeId: 'node-002', timestamp: 1000 })
      useMetricsStore.getState().setNodes([a, b])
      const [storedA, storedB] = useMetricsStore.getState().nodes

      const newB = { ...b, cpu: 90, timestamp: 2000 }
      useMetricsStore.getState().setNodes([{ ...a }, newB])

      const [afterA, afterB] = useMetricsStore.getState().nodes
      expect(afterA).toBe(storedA)
      expect(afterB).not.toBe(storedB)
      expect(afterB.cpu).toBe(90)
    })

    it('accepts nodes that were not in the previous snapshot', () => {
      useMetricsStore.getState().setNodes([makeNode({ nodeId: 'node-001' })])

      useMetricsStore
        .getState()
        .setNodes([makeNode({ nodeId: 'node-001' }), makeNode({ nodeId: 'node-002' })])

      expect(useMetricsStore.getState().nodes.map((n) => n.nodeId)).toEqual([
        'node-001',
        'node-002',
      ])
    })
  })

  describe('selectors', () => {
    beforeEach(() => {
      useMetricsStore.getState().setNodes([
        makeNode({ nodeId: 'node-001', status: 'OK', cpu: 20, memory: 40, latency: 40 }),
        makeNode({ nodeId: 'node-002', status: 'OK', cpu: 40, memory: 50, latency: 60 }),
        makeNode({ nodeId: 'node-003', status: 'WARNING', cpu: 70, memory: 60, latency: 200 }),
        makeNode({ nodeId: 'node-004', status: 'CRITICAL', cpu: 90, memory: 90, latency: 300 }),
      ])
    })

    it('counts nodes by status', () => {
      const state = useMetricsStore.getState()
      expect(selectActiveNodes(state)).toBe(4)
      expect(selectOkCount(state)).toBe(2)
      expect(selectWarningCount(state)).toBe(1)
      expect(selectCriticalCount(state)).toBe(1)
    })

    it('averages the metrics and rounds them', () => {
      const state = useMetricsStore.getState()
      expect(selectAverageCpu(state)).toBe(55)
      expect(selectAverageMemory(state)).toBe(60)
      expect(selectAverageLatency(state)).toBe(150)
    })

    it('returns 0 averages when there are no nodes', () => {
      useMetricsStore.getState().reset()
      const state = useMetricsStore.getState()
      expect(selectAverageCpu(state)).toBe(0)
      expect(selectAverageMemory(state)).toBe(0)
      expect(selectAverageLatency(state)).toBe(0)
    })
  })

  it('reset clears the nodes', () => {
    useMetricsStore.getState().setNodes([makeNode()])
    useMetricsStore.getState().reset()
    expect(useMetricsStore.getState().nodes).toEqual([])
  })
})
