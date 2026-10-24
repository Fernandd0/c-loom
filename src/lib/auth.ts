import { createClient } from '@/lib/supabase/client'

// Redirects to Google; the browser comes back through /auth/callback.
export async function signInWithGoogle() {
  const { error } = await createClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) throw error
}

export async function signOut() {
  await createClient().auth.signOut()
}
