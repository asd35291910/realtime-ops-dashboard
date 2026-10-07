import { useEffect } from 'react'
import { useMetricsStore } from '../stores/metricsStore'
import { WebSocketClient } from '../services/websocket/WebSocketClient'
import type { MetricsSnapshot } from '../types/metrics'

export function useMetricsConnection(url: string) {
  const setNodes = useMetricsStore((state) => state.setNodes)

  useEffect(() => {
    const client = new WebSocketClient<MetricsSnapshot>(url, {
      onMessage: (snapshot) => setNodes(snapshot.nodes),
    })

    client.connect()

    // Cleanup on unmount
    return () => client.disconnect()
  }, [url, setNodes])
}
