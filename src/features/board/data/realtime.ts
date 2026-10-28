export interface RowChange {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  old: Record<string, unknown>
}

// Inserts and updates arrive only for rows RLS lets us read. Deletes reach every
// subscriber and carry just the key, so they only matter for rows we already have.
export function isRelevantChange(change: RowChange, knownIds: Set<string>) {
  if (change.eventType !== 'DELETE') return true
  const key =
    change.table === 'workspace_members'
      ? change.old.workspace_id
      : change.old.id
  return typeof key === 'string' && knownIds.has(key)
}

// Remote changes reload the board. While a local write is still saving, the reload
// waits for it, so it can't bring back the state from before that write.
export function createReloadGate() {
  let inFlight = 0
  let queued: (() => void) | null = null
  return {
    begin() {
      inFlight++
    },
    end() {
      inFlight = Math.max(0, inFlight - 1)
      if (inFlight === 0 && queued) {
        const run = queued
        queued = null
        run()
      }
    },
    request(reload: () => void) {
      if (inFlight > 0) queued = reload
      else reload()
    },
  }
}
