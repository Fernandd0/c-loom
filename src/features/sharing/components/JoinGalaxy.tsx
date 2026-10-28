'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Orbit } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { signInWithGoogle } from '@/lib/auth'
import { Loader } from '@/components/ui/loader'
import { createSupabaseSource } from '@/features/board/data/supabaseSource'
import { savePendingInvite } from '../lib/pendingInvite'

// Same key the board uses for the selected galaxy (stored as JSON).
const CURRENT_BOARD_KEY = 'c-loom-current-board'

type State =
  | { kind: 'checking' }
  | { kind: 'signed-out' }
  | { kind: 'joining' }
  | { kind: 'failed' }

// Opening an invite link: join and go to the galaxy, or sign in first and come back.
export function JoinGalaxy({ token }: { token: string }) {
  const router = useRouter()
  const [state, setState] = useState<State>({ kind: 'checking' })

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const join = async (user: User) => {
      setState({ kind: 'joining' })
      try {
        const boardId = await createSupabaseSource(
          supabase,
          user.id
        ).sharing!.join(token)
        try {
          window.localStorage.setItem(
            CURRENT_BOARD_KEY,
            JSON.stringify(boardId)
          )
        } catch {
          // Storage blocked: the board opens on the first galaxy instead.
        }
        router.replace('/')
      } catch (e) {
        console.error('Error joining galaxy:', e)
        if (!cancelled) setState({ kind: 'failed' })
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return
      if (user) join(user)
      else setState({ kind: 'signed-out' })
    })
    return () => {
      cancelled = true
    }
  }, [token, router])

  const signIn = async () => {
    savePendingInvite(token)
    setState({ kind: 'joining' })
    try {
      await signInWithGoogle()
    } catch (e) {
      console.error('Google sign-in failed:', e)
      setState({ kind: 'signed-out' })
    }
  }

  if (state.kind === 'checking' || state.kind === 'joining') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-(--page)">
        <Loader />
      </div>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-(--page) p-6">
      <div className="w-full max-w-sm space-y-5 text-center">
        <Orbit className="mx-auto h-8 w-8 text-(--fg-3)" />
        {state.kind === 'signed-out' ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-(--fg)">
                You&apos;re invited to a galaxy
              </h1>
              <p className="text-[15px] text-(--fg-3)">
                Sign in to see its tasks and work on them together. Every circle
                is a task; the biggest one goes first.
              </p>
            </div>
            <button
              onClick={signIn}
              className="h-12 w-full rounded-2xl bg-(--ink) px-8 text-[15px] font-semibold text-white transition-colors hover:bg-(--ink-hover)"
            >
              Sign in with Google to join
            </button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-(--fg)">
                This invite doesn&apos;t work
              </h1>
              <p className="text-[15px] text-(--fg-3)">
                The link was reset or turned off. Ask for a new one.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-(--surface) text-[15px] font-semibold text-(--fg-2) ring-1 ring-(--line) hover:text-(--fg)"
            >
              Go to your galaxies
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
