import { describe, expect, it } from 'vitest'
import { earlyAccessLabel } from '@/features/auth/lib/earlyAccess'

describe('earlyAccessLabel', () => {
  it('counts the accounts that have joined out of 100', () => {
    expect(earlyAccessLabel(0)).toBe('0/100 users')
    expect(earlyAccessLabel(15)).toBe('15/100 users')
    expect(earlyAccessLabel(99)).toBe('99/100 users')
  })

  it('hides the offer once the spots are gone', () => {
    expect(earlyAccessLabel(100)).toBeNull()
    expect(earlyAccessLabel(137)).toBeNull()
  })

  it('hides the offer when the count is unknown', () => {
    expect(earlyAccessLabel(null)).toBeNull()
    expect(earlyAccessLabel(undefined)).toBeNull()
    expect(earlyAccessLabel('15')).toBeNull()
    expect(earlyAccessLabel(-1)).toBeNull()
    expect(earlyAccessLabel(1.5)).toBeNull()
  })
})
