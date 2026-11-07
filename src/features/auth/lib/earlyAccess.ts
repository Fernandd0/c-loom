// The landing shows how many of the early-access spots are taken.
export const EARLY_ACCESS_SPOTS = 100

// Label for the early-access counter, or null to hide it. Hidden when the count is
// unknown (no service key, failed request) and once the spots are gone, so the page
// never invents scarcity ("Limited Spots") or shows an impossible "137/100".
export function earlyAccessLabel(count: unknown): string | null {
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
    return null
  }
  if (count >= EARLY_ACCESS_SPOTS) return null
  return `${count}/${EARLY_ACCESS_SPOTS} users`
}
