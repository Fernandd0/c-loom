'use client'

import { useState, useEffect } from 'react'
import { Info, AlertTriangle, AlertOctagon } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useStickyState } from './hooks/useStickyState'
import { useCollisionResolution } from './hooks/useCollisionResolution'
import TaskCircle from './components/TaskCircle'
import { Task, Category } from './types'
import { Button } from '@/components/ui/button'
import { AddTaskDialog } from './components/AddTaskDialog'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function Home() {
  const [tasks, setTasks, isLoaded] = useStickyState<Task[]>([], 'c-loom-tasks')
  const [categories, setCategories] = useStickyState<Category[]>([
      { id: '1', name: 'Work', color: '#3b82f6' },
      { id: '2', name: 'Personal', color: '#10b981' },
      { id: '3', name: 'Urgent', color: '#ef4444' }
  ], 'c-loom-categories')


  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    

    if (typeof window !== 'undefined') {
        handleResize()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useCollisionResolution(tasks, setTasks, {
    containerWidth: windowSize.width,
    containerHeight: windowSize.height,
    padding: 20
  })


  useEffect(() => {
    if (!isLoaded) return

    let hasChanges = false
    const migratedTasks = tasks.map((task) => {
        if (task.x === undefined || task.y === undefined) {
            hasChanges = true
            return {
                ...task,
                x: Math.random() * 80 + 10,
                y: Math.random() * 60 + 20
            }
        }
        return task
    })

    if (hasChanges) {
      setTasks(migratedTasks)
    }
  }, [isLoaded, tasks, setTasks])




  const addTask = (title: string, color?: string, durationMinutes?: number) => {
    if (!title.trim()) return


    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      createdAt: Date.now(),

      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      color,
      durationMinutes
    }

    setTasks((prev) => [...prev, newTask])
  }

  const addCategory = (category: Category) => {
      setCategories(prev => [...prev, category])
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


      <div className="fixed top-0 left-0 z-50 flex w-full items-center justify-between p-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900/80 backdrop-blur-sm">
          C-LOOM
        </h1>
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5">
                    <Info className="h-6 w-6 text-slate-600" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-0 bg-white/80 backdrop-blur-xl shadow-2xl rounded-[2rem]">
                <div className="space-y-4 text-center">
                    <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Create tasks with a deadline. They grow over time.
                        <br/>
                        <span className="font-semibold text-slate-800">Complete them before they take over.</span>
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 py-2">
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                             <div className="flex justify-center mb-2"><AlertTriangle className="h-6 w-6 text-amber-500"/></div>
                             <p className="text-xs font-medium text-amber-900">Warning after 24h</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                             <div className="flex justify-center mb-2"><AlertOctagon className="h-6 w-6 text-rose-500"/></div>
                             <p className="text-xs font-medium text-rose-900">Urgent after 48h</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-sm text-slate-500 mb-2">
                            Ideas or questions? Reach out:
                        </p>
                        <a 
                            href="https://fernan-do.dev/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
                        >
                            fernan-do.dev
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>

      <div className="relative z-30 mx-auto h-[calc(100vh-200px)] w-full max-w-7xl content-center items-center justify-center p-6">
        <AnimatePresence>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="absolute hover:z-50 transition-z duration-200"
              style={{
                top: `${task.y}%`,
                left: `${task.x}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <TaskCircle task={task} onComplete={completeTask} />
            </div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="mt-20 animate-pulse text-center text-slate-400">
            <p className="text-lg font-medium">All clear.</p>
            <p className="text-sm opacity-70">Enjoy the silence.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 z-40 w-full flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
           <AddTaskDialog
               categories={categories} 
               onAddTask={addTask} 
               onAddCategory={addCategory}
           />
        </div>
      </div>
    </main>
  )
}
