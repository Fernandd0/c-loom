// An invite opened while signed out, kept on this device until the visitor signs in.
// Saves sending the token through the OAuth redirect.
const PENDING_INVITE_KEY = 'c-loom-pending-invite'

export function savePendingInvite(token: string) {
  try {
    window.localStorage.setItem(PENDING_INVITE_KEY, token)
  } catch {
    // Storage blocked: after signing in, the link has to be opened again.
  }
}

// Returns the saved invite once, then forgets it.
export function takePendingInvite() {
  try {
    const token = window.localStorage.getItem(PENDING_INVITE_KEY)
    window.localStorage.removeItem(PENDING_INVITE_KEY)
    return token
  } catch {
    return null
  }
}

export const inviteUrl = (token: string) =>
  `${window.location.origin}/join/${token}`
