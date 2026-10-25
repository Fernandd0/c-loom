import { describe, expect, it } from 'vitest'
import { resolveTheme } from '@/lib/theme'

describe('resolveTheme', () => {
  it('uses the chosen theme, or follows the system on Automatic', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('galaxy', false)).toBe('galaxy')
    expect(resolveTheme('system', true)).toBe('galaxy')
    expect(resolveTheme('system', false)).toBe('light')
  })
})
