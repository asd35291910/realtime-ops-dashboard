export interface WebSocketClientCallbacks {
  onOpen?: () => void
  onMessage?: (data: string) => void
  onError?: (error: Event) => void
  onClose?: () => void
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectDelay = 1000
  private reconnectTimeout: number | null = null
  // False after disconnect(): stops onclose from scheduling a reconnect
  private shouldReconnect = true
  private callbacks: WebSocketClientCallbacks = {}

  constructor(url: string, callbacks?: WebSocketClientCallbacks) {
    this.url = url
    if (callbacks) {
      this.callbacks = callbacks
    }
  }

  connect() {
    this.shouldReconnect = true
    this.closeCurrentSocket()

    const socket = new WebSocket(this.url)
    this.ws = socket

    socket.onopen = () => {
      console.log(`WebSocket connected to ${this.url}`)
      this.reconnectDelay = 1000 // Reset delay on successful connection
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

      if (!this.shouldReconnect) return

      // Reconnect with exponential backoff (max 10s)
      const delay = Math.min(this.reconnectDelay, 10000)
      console.log(`Reconnecting in ${delay}ms...`)

      this.reconnectTimeout = window.setTimeout(() => {
        this.reconnectDelay *= 2
        this.connect()
      }, delay)
    }
  }

  send(data: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  disconnect() {
    this.shouldReconnect = false
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
