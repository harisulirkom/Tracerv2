import { describe, expect, it } from 'vitest'
import { normalizeSalaryMillion, normalizeWaitingMonths } from '../src/utils/tracerMetrics'

describe('tracer metric normalization', () => {
  it.each([
    ['<1juta', 0.5],
    ['1-3juta', 2],
    ['Antara 3 - 5 juta', 4],
    ['>5juta', 5],
    ['Rp 6.000.000', 6],
    ['5,5 juta', 5.5],
  ])('normalizes salary %s to %s million', (raw, expected) => {
    expect(normalizeSalaryMillion(raw)).toBe(expected)
  })

  it('keeps a real zero wait while rejecting missing and unreasonable values', () => {
    expect(normalizeWaitingMonths(0)).toBe(0)
    expect(normalizeWaitingMonths('')).toBeNull()
    expect(normalizeWaitingMonths('2024-01-01')).toBeNull()
    expect(normalizeWaitingMonths(121)).toBeNull()
  })
})
