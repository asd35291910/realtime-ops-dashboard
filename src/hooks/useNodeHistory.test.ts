import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeNode } from '../test/factories'
import type { NodeMetric } from '../types/metrics'
import { useNodeHistory } from './useNodeHistory'

describe('useNodeHistory', () => {
  it('is empty while no node is selected', () => {
    const { result } = renderHook(() => useNodeHistory(null))
    expect(result.current).toEqual([])
  })

  it('starts with the selected node reading', () => {
    const node = makeNode({ cpu: 33, memory: 44, latency: 55, timestamp: 1000 })
    const { result } = renderHook(() => useNodeHistory(node))
    expect(result.current).toEqual([{ timestamp: 1000, cpu: 33, memory: 44, latency: 55 }])
  })

  it('adds a point each time the node is updated', () => {
    const { result, rerender } = renderHook(({ node }) => useNodeHistory(node), {
      initialProps: { node: makeNode({ cpu: 10, timestamp: 1000 }) as NodeMetric | null },
    })

    rerender({ node: makeNode({ cpu: 20, timestamp: 2000 }) })
    rerender({ node: makeNode({ cpu: 30, timestamp: 3000 }) })

    expect(result.current.map((p) => p.cpu)).toEqual([10, 20, 30])
  })

  it('does not add a point when the same node object is rendered again', () => {
    const node = makeNode()
    const { result, rerender } = renderHook(({ n }) => useNodeHistory(n), {
      initialProps: { n: node },
    })

    rerender({ n: node })

    expect(result.current).toHaveLength(1)
  })

  it('keeps only the last 20 points', () => {
    const { result, rerender } = renderHook(({ node }) => useNodeHistory(node), {
      initialProps: { node: makeNode({ cpu: 0, timestamp: 0 }) as NodeMetric | null },
    })

    for (let i = 1; i <= 25; i++) {
      rerender({ node: makeNode({ cpu: i, timestamp: i }) })
    }

    expect(result.current).toHaveLength(20)
    expect(result.current[0].cpu).toBe(6)
    expect(result.current[19].cpu).toBe(25)
  })

  it('restarts the history when another node is selected', () => {
    const { result, rerender } = renderHook(({ node }) => useNodeHistory(node), {
      initialProps: { node: makeNode({ nodeId: 'node-001', cpu: 10 }) as NodeMetric | null },
    })
    rerender({ node: makeNode({ nodeId: 'node-001', cpu: 20, timestamp: 2000 }) })

    rerender({ node: makeNode({ nodeId: 'node-002', cpu: 77, timestamp: 3000 }) })

    expect(result.current).toHaveLength(1)
    expect(result.current[0].cpu).toBe(77)
  })

  it('starts a new history when the same node is selected again after being deselected', () => {
    const { result, rerender } = renderHook(({ node }) => useNodeHistory(node), {
      initialProps: { node: makeNode({ cpu: 10, timestamp: 1000 }) as NodeMetric | null },
    })
    rerender({ node: makeNode({ cpu: 20, timestamp: 2000 }) })
    expect(result.current).toHaveLength(2)

    rerender({ node: null })
    rerender({ node: makeNode({ cpu: 30, timestamp: 3000 }) })

    expect(result.current.map((p) => p.cpu)).toEqual([30])
  })

  it('returns an empty history when the node is deselected', () => {
    const { result, rerender } = renderHook(({ node }) => useNodeHistory(node), {
      initialProps: { node: makeNode() as NodeMetric | null },
    })

    rerender({ node: null })

    expect(result.current).toEqual([])
  })
})
