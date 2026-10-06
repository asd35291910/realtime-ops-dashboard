import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeNode } from '../test/factories'
import { useNodeSelection } from './useNodeSelection'

const nodes = [
  makeNode({ nodeId: 'node-001', cpu: 10 }),
  makeNode({ nodeId: 'node-002', cpu: 20 }),
]

describe('useNodeSelection', () => {
  it('starts with nothing selected', () => {
    const { result } = renderHook(() => useNodeSelection(nodes))
    expect(result.current.selectedNode).toBeNull()
    expect(result.current.history).toEqual([])
  })

  it('selects a node', () => {
    const { result } = renderHook(() => useNodeSelection(nodes))

    act(() => result.current.select(nodes[1]))

    expect(result.current.selectedNode).toBe(nodes[1])
    expect(result.current.history).toHaveLength(1)
  })

  it('follows the live node when the list is updated', () => {
    const { result, rerender } = renderHook(({ list }) => useNodeSelection(list), {
      initialProps: { list: nodes },
    })
    act(() => result.current.select(nodes[0]))

    const updated = makeNode({ nodeId: 'node-001', cpu: 99, timestamp: 2000 })
    rerender({ list: [updated, nodes[1]] })

    expect(result.current.selectedNode).toBe(updated)
    expect(result.current.history.map((p) => p.cpu)).toEqual([10, 99])
  })

  it('clears the selection', () => {
    const { result } = renderHook(() => useNodeSelection(nodes))
    act(() => result.current.select(nodes[0]))

    act(() => result.current.clear())

    expect(result.current.selectedNode).toBeNull()
    expect(result.current.history).toEqual([])
  })

  it('restarts the history when the node is selected again', () => {
    const { result, rerender } = renderHook(({ list }) => useNodeSelection(list), {
      initialProps: { list: nodes },
    })
    act(() => result.current.select(nodes[0]))
    rerender({ list: [makeNode({ nodeId: 'node-001', cpu: 50, timestamp: 2000 }), nodes[1]] })
    expect(result.current.history).toHaveLength(2)

    act(() => result.current.clear())
    act(() => result.current.select(nodes[0]))

    expect(result.current.history).toHaveLength(1)
  })

  it('has no selected node when it disappears from the list', () => {
    const { result, rerender } = renderHook(({ list }) => useNodeSelection(list), {
      initialProps: { list: nodes },
    })
    act(() => result.current.select(nodes[0]))

    rerender({ list: [nodes[1]] })

    expect(result.current.selectedNode).toBeNull()
  })

  it('keeps select and clear stable between renders', () => {
    const { result, rerender } = renderHook(() => useNodeSelection(nodes))
    const { select, clear } = result.current

    rerender()

    expect(result.current.select).toBe(select)
    expect(result.current.clear).toBe(clear)
  })
})
