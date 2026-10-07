import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMetricsConnection } from './useMetricsConnection'
import { useMetricsStore } from '../stores/metricsStore'
import { makeNode } from '../test/factories'

// Minimal stand-in for the browser WebSocket: tests trigger its events by hand
class FakeWebSocket {
  static instances: FakeWebSocket[] = []

  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((error: Event) => void) | null = null
  onclose: (() => void) | null = null

  constructor() {
    FakeWebSocket.instances.push(this)
  }

  close() {}
}

const lastSocket = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1]

describe('useMetricsConnection', () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    useMetricsStore.getState().reset()
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.useFakeTimers()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('starts as connecting', () => {
    const { result } = renderHook(() => useMetricsConnection('ws://x'))

    expect(result.current).toBe('connecting')
  })

  it('becomes connected when the socket opens', () => {
    const { result } = renderHook(() => useMetricsConnection('ws://x'))

    act(() => lastSocket().onopen?.())

    expect(result.current).toBe('connected')
  })

  it('becomes disconnected when the socket closes', () => {
    const { result } = renderHook(() => useMetricsConnection('ws://x'))
    act(() => lastSocket().onopen?.())

    act(() => lastSocket().onclose?.())

    expect(result.current).toBe('disconnected')
  })

  it('puts the received nodes in the store', () => {
    renderHook(() => useMetricsConnection('ws://x'))
    const node = makeNode({ nodeId: 'node-001' })

    act(() => lastSocket().onmessage?.({ data: JSON.stringify({ nodes: [node], timestamp: 1 }) }))

    expect(useMetricsStore.getState().nodes).toEqual([node])
  })
})
