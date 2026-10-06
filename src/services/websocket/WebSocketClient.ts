export interface WebSocketClientCallbacks {
  onOpen?: () => void
  onMessage?: (data: string) => void
  onError?: (error: Event) => void
  onClose?: () => void
}

const INITIAL_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 10000

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectDelay = INITIAL_RECONNECT_DELAY_MS
  private reconnectTimeout: number | null = null
  private callbacks: WebSocketClientCallbacks = {}

  constructor(url: string, callbacks?: WebSocketClientCallbacks) {
    this.url = url
    if (callbacks) {
      this.callbacks = callbacks
    }
  }

  connect() {
    this.closeCurrentSocket()

    const socket = new WebSocket(this.url)
    this.ws = socket

    socket.onopen = () => {
      console.log(`WebSocket connected to ${this.url}`)
      this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS // Reset delay on successful connection
      this.callbacks.onOpen?.()
    }

    socket.onmessage = (event) => {
      this.callbacks.onMessage?.(event.data)
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.callbacks.onError?.(error)
    }

    socket.onclose = () => {
      console.log('WebSocket disconnected')
      this.ws = null
      this.callbacks.onClose?.()

      // Reconnect with exponential backoff (capped)
      const delay = this.reconnectDelay
      console.log(`Reconnecting in ${delay}ms...`)

      this.reconnectTimeout = window.setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS)
        this.connect()
      }, delay)
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.closeCurrentSocket()
  }

  // Detach handlers first so the old socket's late events cannot touch the new state
  private closeCurrentSocket() {
    if (!this.ws) return
    this.ws.onopen = null
    this.ws.onmessage = null
    this.ws.onerror = null
    this.ws.onclose = null
    this.ws.close()
    this.ws = null
  }
}
