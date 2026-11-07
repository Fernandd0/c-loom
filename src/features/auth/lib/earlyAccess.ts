// The first accounts get everything free, forever; the landing counts who has joined.
export const EARLY_ACCESS_SPOTS = 100

// Label for the joined counter ("15/100 users"), or null to hide the whole offer. Hidden when the
// count is unknown (no service key, failed request) and once the spots are gone, so
// the page never promises "free forever" to someone who will not get it.
export function earlyAccessLabel(count: unknown): string | null {
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
    return null
  }
  if (count >= EARLY_ACCESS_SPOTS) return null
  return `${count}/${EARLY_ACCESS_SPOTS} users`
}
