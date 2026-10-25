import { describe, expect, it } from 'vitest'
import { resolveTheme } from '@/lib/theme'

describe('resolveTheme', () => {
  it('uses the chosen theme, or follows the system on Automatic', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('galaxy', false)).toBe('galaxy')
    // Automatic picks the clean dark theme; galaxy is only an explicit choice.
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})
