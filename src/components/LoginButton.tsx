'use client'

import { useState } from 'react'
import { Cloud } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import { signInWithGoogle } from '@/lib/auth'
import { SettingsGroup, SettingsRow } from '@/app/components/SettingsRow'

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
    <SettingsGroup>
      <SettingsRow
        icon={<Cloud />}
        tint="#34C759"
        label="Sign in to sync"
        onClick={handleLogin}
      />
    </SettingsGroup>
  )
}
