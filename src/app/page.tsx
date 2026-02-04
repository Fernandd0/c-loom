'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStickyState } from './hooks/useStickyState'
import { useCollisionResolution } from './hooks/useCollisionResolution'
import TaskCircle from './components/TaskCircle'
import { Task, Category } from './types'
import { AddTaskDialog } from './components/AddTaskDialog'
import { TaskDetailDialog } from './components/TaskDetailDialog'
import TypingTitle from './components/TypingTitle'
import { InfoDialog } from './components/InfoDialog'

export default function Home() {
  const [tasks, setTasks, isLoaded] = useStickyState<Task[]>([], 'c-loom-tasks')
  const [categories, setCategories] = useStickyState<Category[]>(
    [
      { id: '1', name: 'Work', color: '#3b82f6' },
      { id: '2', name: 'Personal', color: '#10b981' },
      { id: '3', name: 'Urgent', color: '#ef4444' },
    ],
    'c-loom-categories'
  )

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
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
    padding: 20,
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
          y: Math.random() * 60 + 20,
        }
      }
      return task
    })

    if (hasChanges) {
      setTasks(migratedTasks)
    }
  }, [isLoaded, tasks, setTasks])

  const addTask = (
    title: string,
    categoryId: string,
    durationMinutes?: number
  ) => {
    if (!title.trim()) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      createdAt: Date.now(),

      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      categoryId,
      durationMinutes,
    }

    setTasks((prev) => [...prev, newTask])
  }

  const addCategory = (category: Category) => {
    setCategories((prev) => [...prev, category])
  }

  const completeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  if (!isLoaded) return null

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-indigo-200/20 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[50vh] w-[50vw] rounded-full bg-rose-200/20 blur-[120px]" />
      </div>

      <div className="fixed top-0 left-0 z-50 flex w-full items-center justify-between p-6">
        <TypingTitle
          prefix="C"
          texts={['', 'IRCLE']}
          suffix="-LOOM"
          className="text-xl font-bold tracking-tight text-slate-900/80 backdrop-blur-sm"
        />
        <InfoDialog />
      </div>

      <div className="relative z-30 mx-auto h-[calc(100vh-200px)] w-full max-w-7xl content-center items-center justify-center p-6">
        <AnimatePresence>
          {tasks.map((task) => {
            const category = categories.find((c) => c.id === task.categoryId)
            return (
              <div
                key={task.id}
                className="transition-z absolute duration-200 hover:z-50"
                style={{
                  top: `${task.y}%`,
                  left: `${task.x}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <TaskCircle
                  task={task}
                  color={category?.color}
                  onComplete={completeTask}
                  onSelect={(t) => setSelectedTask(t)}
                />
              </div>
            )
          })}
        </AnimatePresence>

        {selectedTask && (
          <TaskDetailDialog
            task={selectedTask}
            category={categories.find((c) => c.id === selectedTask.categoryId)}
            open={!!selectedTask}
            onOpenChange={(open) => !open && setSelectedTask(null)}
            onDelete={completeTask}
          />
        )}

        {tasks.length === 0 && (
          <div className="mt-20 animate-pulse text-center text-slate-400">
            <p className="text-lg font-medium">All clear.</p>
            <p className="text-sm opacity-70">Enjoy the silence.</p>
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 z-40 flex w-full justify-center">
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
