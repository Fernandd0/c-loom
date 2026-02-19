'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Layout } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Loader } from '@/components/ui/loader'
import { User } from '@supabase/supabase-js'

interface LandingPageProps {
  onCreateWorkspace: () => void
  user?: User | null
}

export function LandingPage({ onCreateWorkspace, user }: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [userCount, setUserCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()

        if (typeof data.count === 'number') {
          setUserCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching user count:', error)
      }
    }
    fetchUserCount()
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)
    const supabase = createClient()
    if (!supabase) {
      setIsLoading(false)
      return
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <Loader />
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F5F5F7] p-6 selection:bg-black/10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex max-w-xl flex-col items-center text-center"
      >
        <motion.p
          className={`font-geist-pixel-circle text-6xl leading-tight font-medium ${user ? 'sm:text-6xl' : 'sm:text-8xl'}`}
          variants={itemVariants}
        >
          {user ? `Welcome,` : 'C-LOOM'} <br />
          {user && user.user_metadata.name}
        </motion.p>

        <motion.p
          variants={itemVariants}
          className="font-geist-sans mb-12 text-xl leading-relaxed font-medium text-[#86868b] sm:text-2xl"
        >
          {user ? '' : 'Visual task management.\nSimple. Flexible. Focused.'}
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row"
        >
          <button
            onClick={onCreateWorkspace}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1C1C1E] px-8 text-[15px] font-semibold text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.02] hover:bg-[#2C2C2E] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] active:scale-[0.98] sm:w-auto sm:min-w-[200px]"
          >
            <Plus size={18} />
            <span>Create Workspace</span>
          </button>

          {!user && (
            <button
              onClick={handleLogin}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 text-[15px] font-semibold text-[#8E8E93] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.05] transition-all hover:bg-slate-50 hover:text-[#1C1C1E] hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] active:scale-[0.98] sm:w-auto sm:min-w-[200px]"
            >
              <span>Sign in to Sync</span>
            </button>
          )}
        </motion.div>

        {!user && (
          <motion.div
            variants={itemVariants}
            className="mt-16 flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              <span className="font-geist-mono text-xs font-medium tracking-wider text-[#86868b] uppercase">
                {userCount !== null
                  ? `${userCount}/100 Users`
                  : 'Limited Spots'}
              </span>
            </div>
            <p className="max-w-[260px] text-center text-[13px] text-[#86868b]">
              Early access includes free unlimited synchronization. <br /> No
              account needed for local use.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
