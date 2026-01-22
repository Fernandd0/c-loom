'use client'

import * as React from 'react'
import { Info, AlertTriangle, AlertOctagon, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { GlassCard } from './GlassCard'
import { Kbd } from './Kbd'

export function InfoDialog() {
  const [activeTab, setActiveTab] = React.useState<
    'guide' | 'hotkeys' | 'contact'
  >('guide')
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
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-black/5"
        >
          <Info className="h-6 w-6 text-slate-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <GlassCard className="p-6">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-full bg-slate-100/50 p-1">
              {(['guide', 'hotkeys', 'contact'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
                    activeTab === tab
                      ? 'bg-white text-black shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[300px]">
            {activeTab === 'guide' && (
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

            {activeTab === 'hotkeys' && (
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

            {activeTab === 'contact' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center justify-center space-y-6 pt-4 text-center duration-300">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Simply Focused
                  </h2>
                  <p className="text-sm text-slate-500">
                    Designed effectively for you.
                  </p>
                </div>

                {/* <div className="w-full max-w-[240px] rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <div className="mb-3 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg">
                      <span className="text-lg font-bold">F</span>
                    </div>
                  </div>
                  <div className="mb-4 space-y-0.5">
                    <p className="font-semibold text-slate-900">Fernando</p>
                    <p className="text-xs text-slate-500">Creator</p>
                  </div>
                  <a
                    href="https://fernan-do.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:ring-slate-300 active:scale-95"
                  >
                    Visit Website
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div> */}

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
