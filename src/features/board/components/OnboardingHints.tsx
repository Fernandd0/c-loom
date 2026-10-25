'use client'

import { useEffect, useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface OnboardingHintsProps {
  show: boolean
  onDismiss: () => void
}

// Hand-drawn pointers to the main controls on a new, empty board. The first click or
// key press anywhere dismisses them for good; they never block the controls themselves.
export function OnboardingHints({ show, onDismiss }: OnboardingHintsProps) {
  useEffect(() => {
    if (!show) return
    window.addEventListener('pointerdown', onDismiss)
    window.addEventListener('keydown', onDismiss)
    return () => {
      window.removeEventListener('pointerdown', onDismiss)
      window.removeEventListener('keydown', onDismiss)
    }
  }, [show, onDismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden
          data-testid="onboarding-hints"
          className="font-hand pointer-events-none fixed inset-0 z-30 text-[#A1A1AA] select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          {/* Sidebar button, top left. */}
          <HintArrow
            className="absolute top-[48px] left-[18px]"
            width={60}
            height={78}
            d="M46 72 C 26 68, 12 50, 15 10"
            delay={0.3}
          />
          <HintNote className="top-[122px] left-[56px] -rotate-2" delay={0.5}>
            Galaxies, guide{'\n'}& shortcuts
          </HintNote>

          {/* Category bar, top center. */}
          <HintArrow
            className="absolute top-[58px] left-[calc(50%+70px)]"
            width={70}
            height={78}
            d="M12 70 C 44 66, 58 38, 28 8"
            delay={0.6}
          />
          {/* On phones it sits right, clear of the sidebar note. */}
          <HintNote
            className="top-[140px] right-4 rotate-1 text-right sm:top-[132px] sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:text-center"
            delay={0.8}
          >
            Pick a category{'\n'}to focus on it
          </HintNote>

          {/* New task button, bottom center: beside it on wider screens, above it on phones. */}
          <HintNote
            className="bottom-[178px] left-1/2 -translate-x-1/2 -rotate-1 text-center sm:right-[calc(50%+184px)] sm:bottom-[76px] sm:left-auto sm:translate-x-0 sm:text-right"
            delay={1.1}
          >
            Add your first task{'\n'}or just press N
          </HintNote>
          <HintArrow
            className="absolute bottom-[104px] left-[calc(50%+18px)] sm:hidden"
            width={54}
            height={70}
            d="M10 6 C 34 16, 38 40, 22 62"
            delay={0.9}
          />
          <HintArrow
            // Ends just outside the button's curve, which sits above the hints.
            className="absolute right-[calc(50%+118px)] bottom-[60px] hidden sm:block"
            width={60}
            height={44}
            d="M4 8 C 26 2, 48 12, 54 36"
            delay={0.9}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function HintNote({
  className,
  delay,
  children,
}: {
  className: string
  delay: number
  children: React.ReactNode
}) {
  return (
    <motion.p
      className={cn(
        'absolute text-[20px] leading-[1.15] whitespace-pre-line sm:text-[22px]',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.p>
  )
}

// A slightly loose curve that draws itself, with an open arrowhead at the end.
export function HintArrow({
  d,
  width,
  height,
  className,
  delay,
}: {
  d: string
  width: number
  height: number
  className: string
  delay: number
}) {
  const marker = `hint-arrow-${useId().replace(/:/g, '')}`
  return (
    <motion.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay }}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path
            d="M1 1.5 L7 5 L1.5 9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </marker>
      </defs>
      <motion.path
        d={d}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        markerEnd={`url(#${marker})`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay, ease: 'easeInOut' }}
      />
    </motion.svg>
  )
}
