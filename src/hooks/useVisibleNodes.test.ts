import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeNode } from '../test/factories'
import { useVisibleNodes } from './useVisibleNodes'

const nodes = [
  makeNode({ nodeId: 'node-002', status: 'OK', cpu: 10, memory: 70, latency: 90 }),
  makeNode({ nodeId: 'node-003', status: 'CRITICAL', cpu: 95, memory: 20, latency: 400 }),
  makeNode({ nodeId: 'node-001', status: 'WARNING', cpu: 60, memory: 50, latency: 10 }),
  makeNode({ nodeId: 'node-004', status: 'OK', cpu: 40, memory: 30, latency: 200 }),
]

const ids = (result: { current: { nodeId: string }[] }) => result.current.map((n) => n.nodeId)

describe('useVisibleNodes', () => {
  describe('filter', () => {
    it('returns every node for ALL', () => {
      const { result } = renderHook(() => useVisibleNodes(nodes, 'ALL', 'nodeId'))
      expect(result.current).toHaveLength(4)
    })

    it.each([
      ['OK', ['node-002', 'node-004']],
      ['WARNING', ['node-001']],
      ['CRITICAL', ['node-003']],
    ] as const)('returns only %s nodes', (status, expected) => {
      const { result } = renderHook(() => useVisibleNodes(nodes, status, 'nodeId'))
      expect(ids(result)).toEqual(expected)
    })
  })

  describe('sort', () => {
    it('sorts by node id ascending', () => {
      const { result } = renderHook(() => useVisibleNodes(nodes, 'ALL', 'nodeId'))
      expect(ids(result)).toEqual(['node-001', 'node-002', 'node-003', 'node-004'])
    })

    it('sorts by CPU, highest first', () => {
      const { result } = renderHook(() => useVisibleNodes(nodes, 'ALL', 'cpu'))
      expect(ids(result)).toEqual(['node-003', 'node-001', 'node-004', 'node-002'])
    })

    it('sorts by memory, highest first', () => {
      const { result } = renderHook(() => useVisibleNodes(nodes, 'ALL', 'memory'))
      expect(ids(result)).toEqual(['node-002', 'node-001', 'node-004', 'node-003'])
    })

    it('sorts by latency, highest first', () => {
      const { result } = renderHook(() => useVisibleNodes(nodes, 'ALL', 'latency'))
      expect(ids(result)).toEqual(['node-003', 'node-004', 'node-002', 'node-001'])
    })
  })

  it('applies the filter and then the sort', () => {
    const { result } = renderHook(() => useVisibleNodes(nodes, 'OK', 'cpu'))
    expect(ids(result)).toEqual(['node-004', 'node-002'])
  })

  it('does not mutate the input array', () => {
    const input = [...nodes]
    renderHook(() => useVisibleNodes(input, 'ALL', 'cpu'))
    expect(input).toEqual(nodes)
  })
})
