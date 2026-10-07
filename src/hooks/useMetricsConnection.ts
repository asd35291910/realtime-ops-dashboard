import { useEffect, useState } from 'react'
import { useMetricsStore } from '../stores/metricsStore'
import { WebSocketClient } from '../services/websocket/WebSocketClient'
import type { MetricsSnapshot } from '../types/metrics'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export function useMetricsConnection(url: string): ConnectionStatus {
  const setNodes = useMetricsStore((state) => state.setNodes)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    const client = new WebSocketClient<MetricsSnapshot>(url, {
      onMessage: (snapshot) => setNodes(snapshot.nodes),
      onOpen: () => setStatus('connected'),
      // onError is always followed by onClose, so closing is the one place that marks the loss
      onClose: () => setStatus('disconnected'),
    })

    client.connect()

    // Cleanup on unmount
    return () => client.disconnect()
  }, [url, setNodes])

  return status
}
