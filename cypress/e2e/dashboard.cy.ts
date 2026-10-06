import { emitSnapshot, mockMetricsSocket, type TestNode } from '../support/mockMetricsSocket'

const node = (overrides: Partial<TestNode>): TestNode => ({
  nodeId: 'node-001',
  status: 'OK',
  cpu: 30,
  memory: 40,
  latency: 50,
  timestamp: 1000,
  ...overrides,
})

const nodes: TestNode[] = [
  node({ nodeId: 'node-001', status: 'OK' }),
  node({ nodeId: 'node-002', status: 'OK', cpu: 25 }),
  node({ nodeId: 'node-003', status: 'WARNING', cpu: 72, memory: 66, latency: 210 }),
  node({ nodeId: 'node-004', status: 'CRITICAL', cpu: 91, memory: 88, latency: 320 }),
  node({ nodeId: 'node-005', status: 'CRITICAL', cpu: 95, memory: 90, latency: 350 }),
]

// Table body rows that are nodes (the spacer rows of the virtual list are not focusable)
const nodeRows = () => cy.get('tbody tr[tabindex="0"]')

describe('Dashboard with fixed data', () => {
  beforeEach(() => {
    cy.visit('/', { onBeforeLoad: (win) => mockMetricsSocket(win, nodes) })
  })

  it('filters the nodes by CRITICAL', () => {
    nodeRows().should('have.length', 5)

    cy.contains('button', /^Critical/).click()

    nodeRows().should('have.length', 2)
    nodeRows().each((row) => cy.wrap(row).should('contain.text', 'CRITICAL'))
    cy.contains('node-004').should('exist')
    cy.contains('node-001').should('not.exist')
    cy.contains('node-003').should('not.exist')
  })

  it('shows the telemetry of a node and keeps it live', () => {
    cy.contains('td', 'node-004').click()

    cy.contains('h2', 'node-004').should('be.visible')
    cy.contains('Historical Metrics').should('be.visible')
    cy.contains('CPU Usage').parent().should('contain.text', '91%')
    cy.contains('Memory Usage').parent().should('contain.text', '88%')
    // "Latency" is also a table column header, so match the card label by its element and exact text
    cy.contains('div', /^Latency$/).parent().should('contain.text', '320ms')
    cy.get('.recharts-wrapper').should('exist')

    // A new snapshot arrives where only node-004 changed
    emitSnapshot(
      nodes.map((n) => (n.nodeId === 'node-004' ? { ...n, cpu: 97, timestamp: 2000 } : n)),
    )

    cy.contains('CPU Usage').parent().should('contain.text', '97%')
  })

  it('closes the telemetry with the Escape key', () => {
    cy.contains('td', 'node-004').click()
    cy.contains('Historical Metrics').should('be.visible')

    cy.get('body').type('{esc}')

    cy.contains('Historical Metrics').should('not.exist')
  })
})

// Needs the mock server on port 3001 (docker-compose up, or npm run server)
describe('Dashboard with the real mock server', () => {
  it('shows live nodes coming from the WebSocket', () => {
    cy.visit('/')

    cy.contains('Monitoring 50 nodes', { timeout: 15000 }).should('be.visible')
    nodeRows().should('have.length.greaterThan', 0)
  })
})
