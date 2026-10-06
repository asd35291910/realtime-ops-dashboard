import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WebSocketClient } from './WebSocketClient'

// Minimal stand-in for the browser WebSocket: tests trigger its events by hand
class FakeWebSocket {
  static instances: FakeWebSocket[] = []

  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((error: Event) => void) | null = null
  onclose: (() => void) | null = null
  closeCalls = 0
  url: string

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  close() {
    this.closeCalls++
  }
}

const sockets = () => FakeWebSocket.instances
const lastSocket = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1]

describe('WebSocketClient', () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.useFakeTimers()
    // The client logs connection events; keep the test output clean
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('opens a socket to the given url', () => {
    new WebSocketClient('ws://example.test').connect()

    expect(sockets()).toHaveLength(1)
    expect(lastSocket().url).toBe('ws://example.test')
  })

  it('passes the received messages to onMessage', () => {
    const onMessage = vi.fn()
    new WebSocketClient('ws://x', { onMessage }).connect()

    lastSocket().onmessage?.({ data: '{"nodes":[]}' })

    expect(onMessage).toHaveBeenCalledWith('{"nodes":[]}')
  })

  it('reports open, error and close through the callbacks', () => {
    const onOpen = vi.fn()
    const onError = vi.fn()
    const onClose = vi.fn()
    new WebSocketClient('ws://x', { onOpen, onError, onClose }).connect()

    lastSocket().onopen?.()
    lastSocket().onerror?.(new Event('error'))
    lastSocket().onclose?.()

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  describe('reconnection', () => {
    it('reconnects one second after the connection closes', () => {
      new WebSocketClient('ws://x').connect()

      lastSocket().onclose?.()
      vi.advanceTimersByTime(999)
      expect(sockets()).toHaveLength(1)
      vi.advanceTimersByTime(1)

      expect(sockets()).toHaveLength(2)
    })

    it('doubles the wait after each failed attempt, up to 10 seconds', () => {
      new WebSocketClient('ws://x').connect()

      // The server never comes back: the socket closes without ever opening
      for (const delay of [1000, 2000, 4000, 8000, 10000, 10000]) {
        const before = sockets().length
        lastSocket().onclose?.()
        vi.advanceTimersByTime(delay - 1)
        expect(sockets()).toHaveLength(before)
        vi.advanceTimersByTime(1)
        expect(sockets()).toHaveLength(before + 1)
      }
    })

    it('goes back to the one second wait once a connection opens', () => {
      new WebSocketClient('ws://x').connect()
      // Two failed attempts: the wait is now 4 seconds
      lastSocket().onclose?.()
      vi.advanceTimersByTime(1000)
      lastSocket().onclose?.()
      vi.advanceTimersByTime(2000)

      lastSocket().onopen?.()
      const before = sockets().length
      lastSocket().onclose?.()
      vi.advanceTimersByTime(1000)

      expect(sockets()).toHaveLength(before + 1)
    })
  })

  describe('disconnect', () => {
    it('closes the socket and ignores its later events', () => {
      const onMessage = vi.fn()
      const client = new WebSocketClient('ws://x', { onMessage })
      client.connect()
      const socket = lastSocket()

      client.disconnect()

      expect(socket.closeCalls).toBe(1)
      expect(socket.onmessage).toBeNull()
      expect(socket.onclose).toBeNull()
    })

    it('cancels a reconnection that was already scheduled', () => {
      const client = new WebSocketClient('ws://x')
      client.connect()
      lastSocket().onclose?.() // schedules a reconnection

      client.disconnect()
      vi.advanceTimersByTime(60_000)

      expect(sockets()).toHaveLength(1)
    })

    it('does not reconnect afterwards', () => {
      const client = new WebSocketClient('ws://x')
      client.connect()

      client.disconnect()
      vi.advanceTimersByTime(60_000)

      expect(sockets()).toHaveLength(1)
    })
  })

  it('closes the previous socket when connect is called again', () => {
    const onMessage = vi.fn()
    const client = new WebSocketClient('ws://x', { onMessage })
    client.connect()
    const first = lastSocket()

    client.connect()

    expect(sockets()).toHaveLength(2)
    expect(first.closeCalls).toBe(1)
    // Late events of the old socket must not reach the callbacks
    expect(first.onmessage).toBeNull()
    expect(onMessage).not.toHaveBeenCalled()
  })
})
