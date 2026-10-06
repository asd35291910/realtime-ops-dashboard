import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { useMetricsStore } from './stores/metricsStore'
import { makeNode } from './test/factories'

// No real WebSocket in tests: the store is filled by hand instead
vi.mock('./hooks/useMetricsConnection', () => ({ useMetricsConnection: vi.fn() }))
// Recharts needs ResizeObserver, which jsdom does not have; the chart is not what these tests cover
vi.mock('./components/MetricsChart', () => ({ MetricsChart: () => <div data-testid="metrics-chart" /> }))

const nodes = [
  makeNode({ nodeId: 'node-001', status: 'OK', cpu: 20, memory: 30, latency: 40 }),
  makeNode({ nodeId: 'node-002', status: 'OK', cpu: 25, memory: 35, latency: 45 }),
  makeNode({ nodeId: 'node-003', status: 'WARNING', cpu: 72, memory: 66, latency: 210 }),
  makeNode({ nodeId: 'node-004', status: 'CRITICAL', cpu: 91, memory: 88, latency: 320 }),
]

// The label and the count are separate elements, so the accessible name has no space: "All(4)"
const filterButton = (label: string, count: number) =>
  screen.getByRole('button', { name: new RegExp(`^${label}\\s*\\(${count}\\)$`) })

describe('App', () => {
  beforeAll(() => {
    // jsdom has no layout: give the list a height so the virtualizer renders rows
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(512)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800)
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    useMetricsStore.getState().reset()
    useMetricsStore.getState().setNodes(nodes)
  })

  it('renders the dashboard title', () => {
    render(<App />)
    expect(screen.getByText('Real-Time Operational Dashboard')).toBeInTheDocument()
  })

  it('lists every node and shows the count per status', () => {
    render(<App />)

    for (const node of nodes) expect(screen.getByText(node.nodeId)).toBeInTheDocument()
    expect(filterButton('All', 4)).toBeInTheDocument()
    expect(filterButton('OK', 2)).toBeInTheDocument()
    expect(filterButton('Warning', 1)).toBeInTheDocument()
    expect(filterButton('Critical', 1)).toBeInTheDocument()
  })

  it('shows only critical nodes after filtering by Critical', () => {
    render(<App />)

    fireEvent.click(filterButton('Critical', 1))

    expect(screen.getByText('node-004')).toBeInTheDocument()
    expect(screen.queryByText('node-001')).not.toBeInTheDocument()
    expect(screen.queryByText('node-003')).not.toBeInTheDocument()
  })

  it('shows every node again after going back to All', () => {
    render(<App />)
    fireEvent.click(filterButton('Critical', 1))

    fireEvent.click(filterButton('All', 4))

    expect(screen.getByText('node-001')).toBeInTheDocument()
    expect(screen.getByText('node-004')).toBeInTheDocument()
  })

  it('opens the node telemetry when a row is clicked', () => {
    render(<App />)
    expect(screen.queryByText('Historical Metrics')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('node-004'))

    expect(screen.getByRole('heading', { name: 'node-004' })).toBeInTheDocument()
    expect(screen.getByText('CPU Usage')).toBeInTheDocument()
    expect(screen.getAllByText('91%').length).toBeGreaterThan(1) // table row + detail card
    expect(screen.getByText('Historical Metrics')).toBeInTheDocument()
    expect(screen.getByTestId('metrics-chart')).toBeInTheDocument()
  })

  it('closes the node telemetry with the Escape key', () => {
    render(<App />)
    fireEvent.click(screen.getByText('node-004'))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByText('Historical Metrics')).not.toBeInTheDocument()
  })

  it('keeps the open telemetry live when the node is updated', () => {
    render(<App />)
    fireEvent.click(screen.getByText('node-004'))

    // A new snapshot arrives: only node-004 changed
    const updated = nodes.map((node) =>
      node.nodeId === 'node-004' ? { ...node, cpu: 97, timestamp: 2000 } : { ...node },
    )
    act(() => useMetricsStore.getState().setNodes(updated))

    expect(screen.getAllByText('97%').length).toBeGreaterThan(1)
    expect(screen.queryByText('91%')).not.toBeInTheDocument()
  })
})
