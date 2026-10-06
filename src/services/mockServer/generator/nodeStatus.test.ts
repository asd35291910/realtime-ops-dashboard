import { describe, expect, it } from 'vitest'
import { deriveStatus } from './nodeStatus'

describe('deriveStatus', () => {
  it('stays OK while metrics are low', () => {
    expect(deriveStatus('OK', 40, 50, 80)).toBe('OK')
  })

  it.each([
    ['cpu', 72, 40, 50],
    ['memory', 40, 72, 50],
    ['latency', 40, 40, 210],
  ])('enters WARNING when %s goes over its threshold', (_metric, cpu, memory, latency) => {
    expect(deriveStatus('OK', cpu, memory, latency)).toBe('WARNING')
  })

  it.each([
    ['cpu', 90, 40, 50],
    ['memory', 40, 90, 50],
    ['latency', 40, 40, 320],
  ])('enters CRITICAL when %s goes over its threshold', (_metric, cpu, memory, latency) => {
    expect(deriveStatus('OK', cpu, memory, latency)).toBe('CRITICAL')
    expect(deriveStatus('WARNING', cpu, memory, latency)).toBe('CRITICAL')
  })

  describe('hysteresis', () => {
    it('keeps WARNING while metrics are between the exit and entry thresholds', () => {
      // 68 is below the entry threshold (70) but above the exit threshold (65)
      expect(deriveStatus('WARNING', 68, 40, 50)).toBe('WARNING')
      expect(deriveStatus('OK', 68, 40, 50)).toBe('OK')
    })

    it('leaves WARNING only once metrics are below the exit threshold', () => {
      expect(deriveStatus('WARNING', 60, 40, 50)).toBe('OK')
    })

    it('keeps CRITICAL while metrics are between the exit and entry thresholds', () => {
      // 80 is below the entry threshold (85) but above the exit threshold (78)
      expect(deriveStatus('CRITICAL', 80, 40, 50)).toBe('CRITICAL')
    })

    it('recovers from CRITICAL to WARNING, never straight to OK', () => {
      expect(deriveStatus('CRITICAL', 40, 40, 50)).toBe('WARNING')
      expect(deriveStatus(deriveStatus('CRITICAL', 40, 40, 50), 40, 40, 50)).toBe('OK')
    })
  })
})
