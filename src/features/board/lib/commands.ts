export interface Searchable {
  label: string
  // Other words that should find it, e.g. "preferences" for Settings.
  keywords?: string[]
}

// 3: the label starts with the query, 2: one of its words does, 1: it appears anywhere
// (or in a keyword), 0: no match. An empty query matches everything equally.
export function matchScore(
  { label, keywords = [] }: Searchable,
  query: string
) {
  const q = query.trim().toLowerCase()
  if (!q) return 1
  const text = label.toLowerCase()
  if (text.startsWith(q)) return 3
  if (text.split(/\s+/).some((word) => word.startsWith(q))) return 2
  if (text.includes(q)) return 1
  return keywords.some((k) => k.toLowerCase().includes(q)) ? 1 : 0
}

// Matching items, best first; ties keep their original order.
export function filterCommands<T extends Searchable>(
  items: T[],
  query: string
) {
  return items
    .map((item, index) => ({ item, index, score: matchScore(item, query) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((m) => m.item)
}
