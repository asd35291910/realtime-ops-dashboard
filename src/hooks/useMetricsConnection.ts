import { useEffect, useRef } from 'react'
import { useMetricsStore } from '../stores/metricsStore'
import { MetricsWebSocketService } from '../services/websocket/MetricsWebSocketService'

export function useMetricsConnection(url: string) {
  const serviceRef = useRef<MetricsWebSocketService | null>(null)
  const setNodes = useMetricsStore((state) => state.setNodes)

  useEffect(() => {
    // Create service instance
    const service = new MetricsWebSocketService(url)
    serviceRef.current = service

    // Subscribe to messages and update store
    service.onMessage((snapshot) => {
      setNodes(snapshot.nodes)
    })

    // Connect
    service.connect()

    // Cleanup on unmount
    return () => {
      service.disconnect()
    }
  }, [url, setNodes])
}
