import express from 'express'
import { WebSocketServer } from 'ws'
import { generateNodes, updateNodeMetrics } from './dataGenerator'
import type { MetricsSnapshot, NodeMetric } from '../../types/metrics'

const PORT = 3001
const UPDATE_INTERVAL_MS = 500 // 2 updates per second

// Initialize Express server
const app = express()

// Enable CORS for Vite dev server
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`)
  console.log(`WebSocket available at ws://localhost:${PORT}`)
})

// Create WebSocket server
const wss = new WebSocketServer({ server })

// Initialize mock data: 50 nodes by default, override with NODE_COUNT for load tests
const NODE_COUNT = Number(process.env.NODE_COUNT) || 50
let nodes: NodeMetric[] = generateNodes(NODE_COUNT)

// Broadcast metrics to all connected clients
function broadcast() {
  // Update node metrics
  nodes = updateNodeMetrics(nodes)

  // Create snapshot
  const snapshot: MetricsSnapshot = {
    nodes,
    timestamp: Date.now(),
  }

  // Send to all connected clients
  const message = JSON.stringify(snapshot)
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // 1 = OPEN
      client.send(message)
    }
  })
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected')

  // Send initial data immediately
  const initialSnapshot: MetricsSnapshot = {
    nodes,
    timestamp: Date.now(),
  }
  ws.send(JSON.stringify(initialSnapshot))

  ws.on('close', () => {
    console.log('Client disconnected')
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

// Start broadcasting updates every 500ms
const broadcastInterval = setInterval(broadcast, UPDATE_INTERVAL_MS)

// Graceful shutdown: close clients, then WebSocket server, then HTTP server.
// Without this, open WebSocket connections keep the process alive.
// Repeated signals must not call wss.close() again: each call adds a listener.
let isShuttingDown = false

function shutdown(signal: string) {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`\n${signal} received, shutting down mock server...`)
  clearInterval(broadcastInterval)

  // Safety net: force exit if a connection keeps the process alive
  setTimeout(() => process.exit(0), 3000).unref()

  // terminate() drops the socket right away; close() waits for the client's
  // handshake, which never ends if a browser tab keeps reconnecting.
  wss.clients.forEach((client) => {
    client.terminate()
  })

  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed')
    // Drop idle keep-alive connections so server.close() can finish
    server.closeAllConnections()
    // Close HTTP server
    server.close(() => {
      console.log('Server stopped')
      process.exit(0)
    })
  })
}

// SIGINT = Ctrl+C in the terminal, SIGTERM = `docker stop`
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

console.log(`Broadcasting metrics every ${UPDATE_INTERVAL_MS}ms to all connected clients`)
