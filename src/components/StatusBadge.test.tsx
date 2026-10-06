import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it.each(['OK', 'WARNING', 'CRITICAL'] as const)('shows the %s status', (status) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(status)).toBeInTheDocument()
  })

  it('uses a different style for each status', () => {
    const classes = (['OK', 'WARNING', 'CRITICAL'] as const).map((status) => {
      const { unmount } = render(<StatusBadge status={status} />)
      const className = screen.getByText(status).className
      unmount()
      return className
    })

    expect(new Set(classes).size).toBe(3)
  })
})
