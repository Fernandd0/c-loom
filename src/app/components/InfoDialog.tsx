'use client'

import * as React from 'react'
import { AlertTriangle, AlertOctagon } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { GlassCard } from './GlassCard'
import { Kbd } from './Kbd'

interface InfoDialogProps {
  defaultTab: 'guide' | 'hotkeys' | 'contact'
  triggerLabel: string
  triggerIcon?: React.ReactNode
}

export function InfoDialog({
  defaultTab,
  triggerLabel,
  triggerIcon,
}: InfoDialogProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'i') {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
          {triggerIcon}
          <span>{triggerLabel}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <GlassCard className="p-6">
          <div className="min-h-[300px]">
            {defaultTab === 'guide' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 text-center duration-300">
                <h2 className="text-2xl font-bold tracking-tight">
                  How it works
                </h2>
                <p className="leading-relaxed text-slate-600">
                  Create tasks with a deadline. They grow over time.
                  <br />
                  <span className="font-semibold text-slate-800">
                    Complete them before they take over.
                  </span>
                </p>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <div className="mb-2 flex justify-center">
                      <AlertTriangle className="h-6 w-6 text-amber-500" />
                    </div>
                    <p className="text-xs font-medium text-amber-900">
                      Warning after 24h
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                    <div className="mb-2 flex justify-center">
                      <AlertOctagon className="h-6 w-6 text-rose-500" />
                    </div>
                    <p className="text-xs font-medium text-rose-900">
                      Urgent after 48h
                    </p>
                  </div>
                </div>
              </div>
            )}

            {defaultTab === 'hotkeys' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
                <h2 className="text-center text-2xl font-bold tracking-tight">
                  Hot Keys
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl border border-white/50 bg-white/50 p-3">
                    <span className="text-sm font-medium text-slate-600">
                      New Task
                    </span>
                    <div className="flex items-center gap-1">
                      <Kbd>⌘</Kbd>
                      <span className="text-xs text-slate-400">+</span>
                      <Kbd>Enter</Kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/50 bg-white/50 p-3">
                    <span className="text-sm font-medium text-slate-600">
                      Open Info
                    </span>
                    <div className="flex items-center gap-1">
                      <Kbd>⌘</Kbd>
                      <span className="text-xs text-slate-400">+</span>
                      <Kbd>I</Kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/50 bg-white/50 p-3">
                    <span className="text-sm font-medium text-slate-600">
                      Delete Task
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Double Click
                    </span>
                  </div>
                </div>
              </div>
            )}

            {defaultTab === 'contact' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center justify-center space-y-6 pt-4 text-center duration-300">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Simply Focused
                  </h2>
                  <p className="text-sm text-slate-500">
                    Designed effectively for you.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-xs text-slate-400">
                    Powered by{' '}
                    <a
                      href="https://fernan-do.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-600 transition-colors hover:text-black"
                    >
                      Kontrol Space
                    </a>
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
