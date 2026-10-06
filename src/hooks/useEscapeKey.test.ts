import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEscapeKey } from './useEscapeKey'

describe('useEscapeKey', () => {
  it('calls the callback when Escape is pressed', () => {
    const onEscape = vi.fn()
    renderHook(() => useEscapeKey(onEscape, true))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('ignores other keys', () => {
    const onEscape = vi.fn()
    renderHook(() => useEscapeKey(onEscape, true))

    fireEvent.keyDown(document, { key: 'Enter' })

    expect(onEscape).not.toHaveBeenCalled()
  })

  it('does nothing while it is not active', () => {
    const onEscape = vi.fn()
    renderHook(() => useEscapeKey(onEscape, false))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onEscape).not.toHaveBeenCalled()
  })

  it('stops listening after unmount', () => {
    const onEscape = vi.fn()
    const { unmount } = renderHook(() => useEscapeKey(onEscape, true))

    unmount()
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onEscape).not.toHaveBeenCalled()
  })
})
