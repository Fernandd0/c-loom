'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { LogOut, LogIn } from 'lucide-react'
import { Loader } from '@/components/ui/loader'

export function LoginButton() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) return

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogin = async () => {
    if (!supabase) return
    setIsLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }

  if (!supabase) return null

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <Loader />
      </div>
    )
  }

  return user ? (
    <div className="group mt-2 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
          {(user.email?.[0] || 'U').toUpperCase()}
        </div>
        <span className="truncate text-xs font-medium text-slate-700">
          {user.email}
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-900/5 transition-all hover:text-red-600 hover:ring-red-100"
      >
        <LogOut size={12} />
        Sign out
      </button>
    </div>
  ) : (
    <button
      onClick={handleLogin}
      className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-black/5 hover:text-black"
    >
      <LogIn size={16} />
      <span>Sign in</span>
    </button>
  )
}
