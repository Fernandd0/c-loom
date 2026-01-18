'use client'

import { useState } from 'react'
import { Plus, Info } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useStickyState } from './hooks/useStickyState'
import TaskCircle from './components/TaskCircle'
import { Task } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function Home() {
  const [tasks, setTasks, isLoaded] = useStickyState<Task[]>([], 'loom-tasks')

  const [input, setInput] = useState('')

  const addTask = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: input.trim(),
      createdAt: Date.now(),
    }

    setTasks((prev) => [...prev, newTask])
    setInput('')
  }

  const completeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  if (!isLoaded) return null

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-indigo-200/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-rose-200/20 blur-[120px]" />
      </div>

      <header className="z-50 mx-auto flex w-full max-w-7xl items-center justify-between p-6 md:p-8">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl font-bold tracking-tighter text-slate-900">
            Loom
          </span>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-slate-500 hover:bg-white/60 hover:text-slate-900 rounded-full transition-colors"
            >
              <Info className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>How Loom Works</DialogTitle>
              <DialogDescription>
                Tasks grow over time to visualize urgency.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full border border-emerald-500/30 bg-emerald-400/20 shadow-sm ring-1 ring-emerald-500/20" />
                <div className="text-sm">
                  <span className="block font-semibold text-emerald-700">
                    Fresh (&lt; 24h)
                  </span>
                  Just added. No pressure.
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full border border-amber-500/40 bg-amber-400/30 shadow-md" />
                <div className="text-sm">
                  <span className="block font-semibold text-amber-700">
                    Warning (24h - 48h)
                  </span>
                  Getting bigger. Don&apos;t ignore it.
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full border border-rose-500/50 bg-rose-500/30 shadow-xl" />
                <div className="text-sm">
                  <span className="block font-semibold text-rose-700">
                    Urgent (&gt; 48h)
                  </span>
                  Looming large! Pop it now!
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative z-30 mx-auto flex w-full max-w-7xl flex-1 flex-wrap content-center items-center justify-center gap-12 p-6 pb-40">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCircle key={task.id} task={task} onComplete={completeTask} />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="mt-20 animate-pulse text-center text-slate-400">
            <p className="text-lg font-medium">All clear.</p>
            <p className="text-sm opacity-70">Enjoy the silence.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 z-40 w-full p-6 md:pb-10">
        <div className="mx-auto w-full max-w-xl">
          <form
            onSubmit={addTask}
            className="group relative flex items-center rounded-[2rem] border border-white/40 bg-white/70 p-2 shadow-2xl shadow-slate-500/10 backdrop-blur-2xl transition-all duration-300 focus-within:bg-white/90 focus-within:ring-2 focus-within:ring-slate-200/50 hover:bg-white/80"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What's on your mind?"
              className="h-12 border-none bg-transparent px-6 text-lg font-medium placeholder:text-slate-400 focus-visible:ring-0"
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 shrink-0 rounded-full bg-slate-900 text-white shadow-lg transition-transform hover:scale-105 hover:bg-slate-800 active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
