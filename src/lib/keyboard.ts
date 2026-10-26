// Single-key shortcuts (N, 1–9, ?) stay quiet while typing or while a dialog is open.
// `allowDialog` names one dialog that doesn't count, e.g. the sidebar drawer.
export function shouldIgnorePlainKey(e: KeyboardEvent, allowDialog?: string) {
  const target = e.target as HTMLElement | null
  const dialog = allowDialog
    ? `[role="dialog"]:not([${allowDialog}])`
    : '[role="dialog"]'
  return (
    !!target?.closest('input, textarea, select, [contenteditable="true"]') ||
    !!document.querySelector(dialog)
  )
}
