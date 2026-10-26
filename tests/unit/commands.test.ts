import { describe, expect, it } from 'vitest'
import { filterCommands, matchScore } from '@/features/board/lib/commands'

const items = [
  { label: 'Settings', keywords: ['preferences', 'theme'] },
  { label: 'Side projects' },
  { label: 'My Galaxy' },
  { label: 'New galaxy' },
  { label: 'Keyboard shortcuts' },
]
const labels = (query: string) =>
  filterCommands(items, query).map((i) => i.label)

describe('matchScore', () => {
  it('ranks a label prefix over a word prefix over a substring', () => {
    expect(matchScore({ label: 'Galaxy one' }, 'gal')).toBe(3)
    expect(matchScore({ label: 'My Galaxy' }, 'gal')).toBe(2)
    expect(matchScore({ label: 'Megalith' }, 'gal')).toBe(1)
    expect(matchScore({ label: 'Settings' }, 'gal')).toBe(0)
  })

  it('ignores case and surrounding spaces', () => {
    expect(matchScore({ label: 'Settings' }, '  SET ')).toBe(3)
  })

  it('finds an item by its keywords', () => {
    expect(matchScore({ label: 'Settings', keywords: ['theme'] }, 'them')).toBe(
      1
    )
  })
})

describe('filterCommands', () => {
  it('keeps everything, in order, for an empty query', () => {
    expect(labels('')).toEqual(items.map((i) => i.label))
  })

  it('puts the best matches first and keeps ties in order', () => {
    expect(labels('gal')).toEqual(['My Galaxy', 'New galaxy'])
    expect(labels('s')).toEqual([
      'Settings',
      'Side projects',
      'Keyboard shortcuts',
    ])
  })

  it('drops what does not match', () => {
    expect(labels('zzz')).toEqual([])
    expect(labels('theme')).toEqual(['Settings'])
  })
})
