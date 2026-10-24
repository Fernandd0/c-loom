'use client'

import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import { signInWithGoogle } from '@/lib/auth'

// Shown only to guests; signed-in users see their profile in the sidebar instead.
export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign-in failed:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <Loader />
      </div>
    )
  }

  return (
    <button
      onClick={handleLogin}
      className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-black/5 hover:text-black"
    >
      <LogIn size={16} />
      <span>Sign in</span>
    </button>
  )
}
