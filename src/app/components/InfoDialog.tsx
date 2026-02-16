'use client'

import * as React from 'react'
import { AlertOctagon } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { GlassCard } from './GlassCard'
import { Kbd } from './Kbd'

interface InfoDialogProps {
  defaultTab: 'guide' | 'hotkeys' | 'contact'
  triggerLabel: string
  triggerIcon?: React.ReactNode
  hotkey?: string
}

export function InfoDialog({
  defaultTab,
  triggerLabel,
  triggerIcon,
  hotkey,
}: InfoDialogProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!hotkey) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key.toLowerCase() === hotkey.toLowerCase()) {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hotkey])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[15px] font-medium text-[#3C3C43] transition-all hover:bg-[#F2F2F7]">
          {triggerIcon}
          <span>{triggerLabel}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <GlassCard className="p-6">
          <div className="min-h-[300px]">
            {defaultTab === 'guide' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
                <div className="text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">
                    How C-LOOM Works
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#3C3C43]">
                    Visual task management that grows with urgency
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E5E5EA] bg-gradient-to-b from-white to-[#FAFAFA] p-4">
                  <p className="text-center text-sm leading-relaxed text-[#1C1C1E]">
                    Tasks{' '}
                    <span className="font-semibold text-[#1C1C1E]">
                      grow larger
                    </span>{' '}
                    as deadlines approach.
                    <br />
                    Complete them before they{' '}
                    <span className="font-semibold text-[#1C1C1E]">
                      take over your screen
                    </span>
                    .
                  </p>
                </div>

                {/* <div className="rounded-2xl border border-[#E5E5EA] bg-gradient-to-br from-[#FFE6E6] to-[#FFD6D6] p-4">
                  <div className="mb-2 flex justify-center">
                    <div className="rounded-full bg-rose-100 p-2">
                      <AlertOctagon className="h-5 w-5 text-rose-600" />
                    </div>
                  </div>
                  <p className="text-center text-xs font-semibold text-rose-900">
                    Urgent Alert
                  </p>
                  <p className="mt-1 text-center text-[10px] text-rose-700">
                    Shows when deadline is within 24 hours
                  </p>
                </div> */}

                <div className="space-y-2.5">
                  <p className="text-center text-xs font-semibold text-[#1C1C1E]">
                    Key Features
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
                      <span className="mt-0.5 text-[#8E8E93]">📁</span>
                      <span className="text-[#3C3C43]">
                        Multiple workspaces
                      </span>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
                      <span className="mt-0.5 text-[#8E8E93]">🏷️</span>
                      <span className="text-[#3C3C43]">Custom categories</span>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
                      <span className="mt-0.5 text-[#8E8E93]">⚡</span>
                      <span className="text-[#3C3C43]">
                        Priority levels 0-10
                      </span>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
                      <span className="mt-0.5 text-[#8E8E93]">🔄</span>
                      <span className="text-[#3C3C43]">Recurring tasks</span>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
                      <span className="mt-0.5 text-[#8E8E93]">☁️</span>
                      <span className="text-[#3C3C43]">
                        Cloud sync with Supabase
                      </span>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
                      <span className="mt-0.5 text-[#8E8E93]">✨</span>
                      <span className="text-[#3C3C43]">
                        Free <span className="text-[#8E8E93]">(for now)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {defaultTab === 'hotkeys' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
                <h2 className="text-center text-2xl font-bold tracking-tight text-[#1C1C1E]">
                  Keyboard Shortcuts
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <span className="text-sm font-medium text-[#1C1C1E]">
                      New Task
                    </span>
                    <div className="flex items-center gap-1">
                      <Kbd>⌘</Kbd>
                      <span className="text-xs text-[#8E8E93]">+</span>
                      <Kbd>Enter</Kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <span className="text-sm font-medium text-[#1C1C1E]">
                      Open Guide
                    </span>
                    <div className="flex items-center gap-1">
                      <Kbd>⌘</Kbd>
                      <span className="text-xs text-[#8E8E93]">+</span>
                      <Kbd>G</Kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <span className="text-sm font-medium text-[#1C1C1E]">
                      Open Shortcuts
                    </span>
                    <div className="flex items-center gap-1">
                      <Kbd>⌘</Kbd>
                      <span className="text-xs text-[#8E8E93]">+</span>
                      <Kbd>K</Kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <span className="text-sm font-medium text-[#1C1C1E]">
                      Delete Task
                    </span>
                    <span className="text-xs font-semibold text-[#8E8E93]">
                      Double Click
                    </span>
                  </div>
                </div>
              </div>
            )}

            {defaultTab === 'contact' && (
              <div className="animate-in fade-in flex flex-col items-center justify-center space-y-2 pt-4 text-center duration-300">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">
                    C-LOOM
                  </h2>
                  <p className="text-sm text-[#3C3C43]">
                    Circle Task Management
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-xs text-[#8E8E93]">
                    Created by{' '}
                    <a
                      href="https://fernan-do.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#3C3C43] transition-colors hover:text-[#1C1C1E]"
                    >
                      Fernando
                    </a>
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <a
                      href="https://x.com/Fernandddd0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-[#E5E5EA] bg-white px-3 py-2 text-xs font-medium text-[#3C3C43] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:bg-[#F2F2F7] hover:text-[#1C1C1E]"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Twitter
                    </a>
                    <a
                      href="https://github.com/Fernandd0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-[#E5E5EA] bg-white px-3 py-2 text-xs font-medium text-[#3C3C43] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:bg-[#F2F2F7] hover:text-[#1C1C1E]"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </a>
                  </div>

                  <p className="text-xs leading-relaxed text-[#8E8E93]">
                    Ideas or suggestions? Write me!
                    <br />
                    ¿Ideas o sugerencias? ¡Escríbeme!
                  </p>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
