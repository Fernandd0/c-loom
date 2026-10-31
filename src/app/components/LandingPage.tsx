'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Orbit } from 'lucide-react'
import { signInWithGoogle } from '@/lib/auth'
import { Loader } from '@/components/ui/loader'
import { User } from '@supabase/supabase-js'
import { LegalFooter } from '@/components/LegalPage'
import { GalaxyText } from '@/features/board/components/GalaxyText'
import {
  HintArrow,
  HintNote,
} from '@/features/board/components/OnboardingHints'

// Hand-drawn notes for signed-out visitors, like a welcome screen. They appear once the
// title has assembled, never block anything, and only show where there is room (lg+).
const HINTS = 'font-hand pointer-events-none select-none text-(--hint)'
const HINT_DELAY = 2.2

interface LandingPageProps {
  onCreateWorkspace: () => void
  user?: User | null
  // A signed-out visitor who already has boards on this device continues to them.
  hasLocalBoards?: boolean
  localTaskCount?: number
  onContinueLocal?: () => void
}

export function LandingPage({
  onCreateWorkspace,
  user,
  hasLocalBoards = false,
  localTaskCount = 0,
  onContinueLocal,
}: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const firstName =
    (user?.user_metadata?.name as string | undefined)?.split(' ')[0] ?? ''
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
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign-in failed:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--glass) backdrop-blur-sm">
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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-(--page) p-6 pb-16 selection:bg-black/10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex max-w-xl flex-col items-center text-center"
      >
        {/* Your universe: the name assembles from planets, like an empty board does. */}
        <h1 className="sr-only">{user ? `Welcome, ${firstName}` : 'c-loom'}</h1>
        <div
          aria-hidden
          className="relative mb-4 w-full text-(--fg) sm:w-[min(60rem,100vw)]"
        >
          <GalaxyText
            lines={user ? ['Welcome,', `${firstName}.`] : ['c-loom']}
            maxFontSize={user ? 72 : 120}
          />
          {!user && (
            <div className={`${HINTS} hidden lg:block`}>
              <HintArrow
                className="absolute top-[54px] left-[calc(50%+212px)]"
                width={58}
                height={40}
                d="M52 6 C 34 2, 14 12, 6 34"
                delay={HINT_DELAY}
              />
              <HintNote
                className="top-[30px] left-[calc(50%+272px)] rotate-2 whitespace-pre"
                delay={HINT_DELAY + 0.2}
              >
                each dot{'\n'}is a task
              </HintNote>
            </div>
          )}
        </div>

        {user ? (
          <motion.p
            variants={itemVariants}
            className="mb-12 text-xl leading-relaxed font-medium whitespace-pre-line text-(--fg-3) sm:text-2xl"
          >
            {'Your universe is ready.\nStart it with a galaxy.'}
          </motion.p>
        ) : (
          // Say what it is before the metaphor: visitors couldn't tell it was a to-do list.
          <motion.div variants={itemVariants} className="mb-12">
            <p className="text-xl leading-relaxed font-semibold text-(--fg) sm:text-2xl">
              A to-do list that shows what matters.
            </p>
            <p className="mt-2 text-base leading-relaxed text-(--fg-3) sm:text-lg">
              Tasks grow as their due date gets closer.
            </p>
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row"
        >
          {hasLocalBoards ? (
            <button
              onClick={onContinueLocal}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-(--ink) px-8 text-[15px] font-semibold text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.02] hover:bg-(--ink-hover) hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] active:scale-[0.98] sm:w-auto sm:min-w-[200px]"
            >
              <span>Continue on this device</span>
              {localTaskCount > 0 && (
                <span className="font-normal text-white/60">
                  · {localTaskCount} {localTaskCount === 1 ? 'task' : 'tasks'}
                </span>
              )}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          ) : (
            <div className="relative w-full sm:w-auto">
              {!user && (
                <div aria-hidden className={HINTS}>
                  {/* Phones and tablets: a short note above the button. */}
                  <HintNote
                    className="right-3 bottom-[calc(100%+6px)] text-[18px] whitespace-pre lg:hidden"
                    delay={HINT_DELAY}
                  >
                    start here, no account needed
                  </HintNote>
                  <HintNote
                    className="top-1/2 right-[calc(100%+68px)] hidden -translate-y-1/2 -rotate-2 text-right whitespace-pre lg:block"
                    delay={HINT_DELAY + 0.3}
                  >
                    start here,{'\n'}no account needed
                  </HintNote>
                  <HintArrow
                    className="absolute top-[4px] right-[calc(100%+8px)] hidden lg:block"
                    width={58}
                    height={30}
                    d="M4 22 C 20 6, 38 6, 52 14"
                    delay={HINT_DELAY + 0.1}
                  />
                </div>
              )}
              <button
                onClick={onCreateWorkspace}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-(--ink) px-8 text-[15px] font-semibold text-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.02] hover:bg-(--ink-hover) hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] active:scale-[0.98] sm:w-auto sm:min-w-[200px]"
              >
                <Orbit size={18} />
                <span>Create your first galaxy</span>
              </button>
            </div>
          )}

          {!user && (
            <div className="relative w-full sm:w-auto">
              <div aria-hidden className={`${HINTS} hidden lg:block`}>
                <HintArrow
                  className="absolute top-[4px] left-[calc(100%+8px)]"
                  width={58}
                  height={30}
                  d="M54 22 C 38 6, 20 6, 6 14"
                  delay={HINT_DELAY + 0.4}
                />
                <HintNote
                  className="top-1/2 left-[calc(100%+68px)] -translate-y-1/2 rotate-2 whitespace-pre"
                  delay={HINT_DELAY + 0.6}
                >
                  keep your universe{'\n'}on every device
                </HintNote>
              </div>
              <button
                onClick={handleLogin}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-(--surface) px-8 text-[15px] font-semibold text-(--fg-3) shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] ring-1 ring-(--line) transition-all hover:bg-(--page) hover:text-(--fg) hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] active:scale-[0.98] sm:w-auto sm:min-w-[200px]"
              >
                <span>Sign in to Sync</span>
              </button>
            </div>
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
              <span className="font-geist-mono text-xs font-medium tracking-wider text-(--fg-3) uppercase">
                {userCount !== null
                  ? `${userCount}/100 Users`
                  : 'Limited Spots'}
              </span>
            </div>
            <p className="max-w-[260px] text-center text-[13px] text-(--fg-3)">
              Early access includes free unlimited synchronization. <br /> No
              account needed for local use.
            </p>
          </motion.div>
        )}
      </motion.div>
      <LegalFooter className="absolute inset-x-0 bottom-6" />
    </div>
  )
}
