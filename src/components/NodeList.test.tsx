import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { makeNode } from '../test/factories'
import type { NodeMetric } from '../types/metrics'
import { NodeList } from './NodeList'

const VIEWPORT_HEIGHT = 512 // same as the max-h-[32rem] of the list

const makeNodes = (count: number): NodeMetric[] =>
  Array.from({ length: count }, (_, i) =>
    makeNode({ nodeId: `node-${String(i + 1).padStart(4, '0')}` }),
  )

// Body rows only: the header row and the spacer rows are not nodes
const nodeRows = () =>
  screen.getAllByRole('row').filter((row) => row.getAttribute('tabindex') === '0')

describe('NodeList', () => {
  beforeAll(() => {
    // jsdom has no layout: give the scroll container a height so the
    // virtualizer knows how many rows fit
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(VIEWPORT_HEIGHT)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the column headers', () => {
    render(<NodeList nodes={makeNodes(3)} />)
    for (const name of ['Node', 'Status', 'CPU', 'Memory', 'Latency']) {
      expect(screen.getByRole('columnheader', { name })).toBeInTheDocument()
    }
  })

  it('shows the values of a node', () => {
    render(
      <NodeList
        nodes={[makeNode({ nodeId: 'node-007', status: 'WARNING', cpu: 71, memory: 62, latency: 188 })]}
      />,
    )
    expect(screen.getByText('node-007')).toBeInTheDocument()
    expect(screen.getByText('WARNING')).toBeInTheDocument()
    expect(screen.getByText('71%')).toBeInTheDocument()
    expect(screen.getByText('62%')).toBeInTheDocument()
    expect(screen.getByText('188ms')).toBeInTheDocument()
  })

  it('only mounts the rows near the viewport, not all of them', () => {
    render(<NodeList nodes={makeNodes(1500)} />)

    const rows = nodeRows()
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThan(60)
    expect(screen.getByText('node-0001')).toBeInTheDocument()
    expect(screen.queryByText('node-1500')).not.toBeInTheDocument()
  })

  it('mounts the rows of the new position after scrolling', () => {
    const { container } = render(<NodeList nodes={makeNodes(1500)} />)
    const scroller = container.firstElementChild as HTMLElement

    scroller.scrollTop = 36 * 1000
    fireEvent.scroll(scroller)

    expect(screen.getByText('node-1001')).toBeInTheDocument()
    expect(screen.queryByText('node-0001')).not.toBeInTheDocument()
  })

  it('calls onNodeSelect with the node when a row is clicked', () => {
    const onNodeSelect = vi.fn()
    const nodes = makeNodes(5)
    render(<NodeList nodes={nodes} onNodeSelect={onNodeSelect} />)

    fireEvent.click(screen.getByText('node-0003'))

    expect(onNodeSelect).toHaveBeenCalledTimes(1)
    expect(onNodeSelect).toHaveBeenCalledWith(nodes[2])
  })

  it('selects a row with the Enter key', () => {
    const onNodeSelect = vi.fn()
    const nodes = makeNodes(5)
    render(<NodeList nodes={nodes} onNodeSelect={onNodeSelect} />)

    fireEvent.keyDown(nodeRows()[1], { key: 'Enter' })

    expect(onNodeSelect).toHaveBeenCalledWith(nodes[1])
  })

  it('does not select a row with other keys', () => {
    const onNodeSelect = vi.fn()
    render(<NodeList nodes={makeNodes(5)} onNodeSelect={onNodeSelect} />)

    fireEvent.keyDown(nodeRows()[0], { key: 'a' })

    expect(onNodeSelect).not.toHaveBeenCalled()
  })
})
