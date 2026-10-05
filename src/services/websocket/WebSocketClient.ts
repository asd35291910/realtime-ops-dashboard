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
  private callbacks: WebSocketClientCallbacks = {}

  constructor(url: string, callbacks?: WebSocketClientCallbacks) {
    this.url = url
    if (callbacks) {
      this.callbacks = callbacks
    }
  }

  connect() {
    if (this.ws) {
      this.ws.close()
    }

    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log(`WebSocket connected to ${this.url}`)
      this.reconnectDelay = 1000 // Reset delay on successful connection
      this.callbacks.onOpen?.()
    }

    this.ws.onmessage = (event) => {
      this.callbacks.onMessage?.(event.data)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.callbacks.onError?.(error)
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.ws = null
      this.callbacks.onClose?.()

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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
