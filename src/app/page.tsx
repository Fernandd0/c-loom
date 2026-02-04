'use client'

import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStickyState } from './hooks/useStickyState'
import { useCollisionResolution } from './hooks/useCollisionResolution'
import TaskCircle from './components/TaskCircle'
import { Task, Category, Board } from './types'
import { AddTaskDialog } from './components/AddTaskDialog'
import { TaskDetailDialog } from './components/TaskDetailDialog'
import TypingTitle from './components/TypingTitle'
import { InfoDialog } from './components/InfoDialog'
import { FloatingMenu } from './components/FloatingMenu'

export default function Home() {
  // Legacy tasks support for migration
  const [legacyTasks] = useStickyState<Task[]>([], 'c-loom-tasks')

  // Board State
  const [boards, setBoards, isLoaded] = useStickyState<Board[]>(
    [],
    'c-loom-boards'
  )
  const [currentBoardId, setCurrentBoardId] = useStickyState<string>(
    '',
    'c-loom-current-board'
  )

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

  // Initialize/Migrate
  useEffect(() => {
    if (!isLoaded) return

    if (boards.length === 0) {
      // Create initial board, migrating legacy tasks if any
      const initialBoardId = crypto.randomUUID()
      const initialBoard: Board = {
        id: initialBoardId,
        name: 'Home',
        tasks: legacyTasks.length > 0 ? legacyTasks : [],
        createdAt: Date.now(),
      }
      setBoards([initialBoard])
      setCurrentBoardId(initialBoardId)
    } else if (
      !currentBoardId ||
      !boards.find((b) => b.id === currentBoardId)
    ) {
      // Ensure valid current board selection
      if (boards.length > 0) {
        setCurrentBoardId(boards[0].id)
      }
    }
  }, [
    isLoaded,
    boards.length,
    legacyTasks,
    setBoards,
    currentBoardId,
    setCurrentBoardId,
  ])

  // Get current board and tasks
  const currentBoard = useMemo(
    () => boards.find((b) => b.id === currentBoardId) || boards[0],
    [boards, currentBoardId]
  )

  const currentTasks = useMemo(() => currentBoard?.tasks || [], [currentBoard])

  // Helper to update current board's tasks
  const setTasks = (newTasksUpdater: Task[] | ((prev: Task[]) => Task[])) => {
    if (!currentBoard) return

    setBoards((prevBoards) =>
      prevBoards.map((board) => {
        if (board.id === currentBoard.id) {
          const newTasks =
            typeof newTasksUpdater === 'function'
              ? newTasksUpdater(board.tasks)
              : newTasksUpdater
          return { ...board, tasks: newTasks }
        }
        return board
      })
    )
  }

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

  // Use collision resolution on the CURRENT board's tasks
  // We need to bridge the interface expected by useCollisionResolution
  // It expects (tasks, setTasks), which we have adapted above.
  useCollisionResolution(currentTasks, setTasks, {
    containerWidth: windowSize.width,
    containerHeight: windowSize.height,
    padding: 20,
  })

  // Ensure tasks have positions
  useEffect(() => {
    if (!isLoaded || !currentBoard) return

    let hasChanges = false
    const migratedTasks = currentTasks.map((task) => {
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
  }, [isLoaded, currentBoardId, currentTasks.length]) // Re-run when switching boards or loading

  const addTask = (
    title: string,
    categoryId: string,
    durationMinutes?: number
  ) => {
    if (!title.trim() || !currentBoard) return

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

  const handleAddBoard = () => {
    const newBoard: Board = {
      id: crypto.randomUUID(),
      name: `Workspace ${boards.length + 1}`,
      tasks: [],
      createdAt: Date.now(),
    }
    setBoards((prev) => [...prev, newBoard])
    setCurrentBoardId(newBoard.id)
  }

  if (!isLoaded) return null

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <FloatingMenu
        boards={boards}
        currentBoardId={currentBoardId}
        onSelectBoard={setCurrentBoardId}
        onAddBoard={handleAddBoard}
        onDeleteBoard={(id) => {
          // Optional: Implement delete logic
          setBoards((prev) => prev.filter((b) => b.id !== id))
          if (currentBoardId === id && boards.length > 1) {
            setCurrentBoardId(boards.find((b) => b.id !== id)?.id || '')
          }
        }}
      />

      <div className="relative flex h-screen w-full flex-1 flex-col transition-all duration-300">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-indigo-200/20 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[50vh] w-[50vw] rounded-full bg-rose-200/20 blur-[120px]" />
        </div>

        {/* Top Navigation / Header */}
        <div className="relative z-30 flex w-full items-center justify-between p-6">
          <div className="ml-12 md:ml-12">
            {' '}
            {/* Spacer for mobile sidebar toggle */}
            <TypingTitle
              prefix="C"
              texts={['', 'IRCLE']}
              suffix="-LOOM"
              className="text-xl font-bold tracking-tight text-slate-900/80 backdrop-blur-sm"
            />
          </div>
          <InfoDialog />
        </div>

        {/* Board Main Area */}
        <div className="relative z-30 mx-auto h-[calc(100vh-100px)] w-full max-w-7xl content-center items-center justify-center p-6">
          {/* Board Title (Optional, showing current board name) */}
          <div className="pointer-events-none absolute top-0 left-6 text-sm font-medium tracking-widest text-slate-400 uppercase">
            {currentBoard?.name}
          </div>

          <AnimatePresence mode="popLayout">
            {currentTasks.map((task) => {
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
              category={categories.find(
                (c) => c.id === selectedTask.categoryId
              )}
              open={!!selectedTask}
              onOpenChange={(open) => !open && setSelectedTask(null)}
              onDelete={completeTask}
            />
          )}

          {currentTasks.length === 0 && (
            <div className="mt-20 animate-pulse text-center text-slate-400">
              <p className="text-lg font-medium">
                All clear on {currentBoard?.name}.
              </p>
              <p className="text-sm opacity-70">Focus or Relax.</p>
            </div>
          )}
        </div>

        {/* Floating Action Button area */}
        <div className="pointer-events-none fixed bottom-0 left-0 z-40 flex w-full justify-center">
          <div className="pointer-events-auto">
            <AddTaskDialog
              categories={categories}
              onAddTask={addTask}
              onAddCategory={addCategory}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
