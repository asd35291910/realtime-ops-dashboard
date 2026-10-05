import { WebSocketClient } from './WebSocketClient'
import type { MetricsSnapshot } from '../../types/metrics'

type MessageCallback = (snapshot: MetricsSnapshot) => void

export class MetricsWebSocketService {
  private client: WebSocketClient
  private messageCallback: MessageCallback | null = null

  constructor(url: string) {
    this.client = new WebSocketClient(url, {
      onMessage: (data) => this.handleMessage(data),
    })
  }

  private handleMessage(data: string) {
    try {
      const snapshot: MetricsSnapshot = JSON.parse(data)
      if (this.messageCallback) {
        this.messageCallback(snapshot)
      }
    } catch (error) {
      console.error('Failed to parse metrics message:', error)
    }
  }

  onMessage(callback: MessageCallback) {
    this.messageCallback = callback
  }

  connect() {
    this.client.connect()
  }

  disconnect() {
    this.client.disconnect()
  }
}
