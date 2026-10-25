import { createClient } from '@/lib/supabase/client'
import { forgetGuestMode } from '@/features/board/data/localSource'

// Redirects to Google; the browser comes back through /auth/callback.
export async function signInWithGoogle() {
  const { error } = await createClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) throw error
}

// Forgets the guest choice first, so the signed-out render already shows the landing.
export async function signOut() {
  forgetGuestMode()
  await createClient().auth.signOut()
}
