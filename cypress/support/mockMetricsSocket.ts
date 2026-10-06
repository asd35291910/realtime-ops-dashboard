// Replaces the browser WebSocket with a fake one so tests get fixed, predictable
// data instead of the random mock server. The app code is not changed.

export interface TestNode {
  nodeId: string
  status: 'OK' | 'WARNING' | 'CRITICAL'
  cpu: number
  memory: number
  latency: number
  timestamp: number
}

type TestWindow = Cypress.AUTWindow & { __emitSnapshot?: (nodes: TestNode[]) => void }

export function mockMetricsSocket(win: Cypress.AUTWindow, initialNodes: TestNode[]) {
  const sockets: FakeSocket[] = []

  class FakeSocket {
    onopen: (() => void) | null = null
    onmessage: ((event: { data: string }) => void) | null = null
    onerror: (() => void) | null = null
    onclose: (() => void) | null = null

    constructor() {
      sockets.push(this)
      // The app sets its handlers right after construction, so connect on the next tick
      setTimeout(() => {
        this.onopen?.()
        this.emit(initialNodes)
      }, 0)
    }

    emit(nodes: TestNode[]) {
      this.onmessage?.({ data: JSON.stringify({ nodes, timestamp: Date.now() }) })
    }

    close() {}
  }

  win.WebSocket = FakeSocket as unknown as typeof WebSocket
  // Lets a test push a new snapshot, as the server would every 500 ms
  ;(win as TestWindow).__emitSnapshot = (nodes) => sockets.forEach((socket) => socket.emit(nodes))
}

export function emitSnapshot(nodes: TestNode[]) {
  cy.window().then((win) => (win as TestWindow).__emitSnapshot?.(nodes))
}
