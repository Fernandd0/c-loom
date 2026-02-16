'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStickyState } from './hooks/useStickyState'
import { useCollisionResolution } from './hooks/useCollisionResolution'
import TaskCircle from './components/TaskCircle'
import { Task, Category, Board, TaskRecurrence } from './types'
import { AddTaskDialog } from './components/AddTaskDialog'
import { TaskDetailDialog } from './components/TaskDetailDialog'
import TypingTitle from './components/TypingTitle'
import { Sidebar } from './components/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useSupabaseData } from './hooks/useSupabaseData'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  // 1. Auth Session Check
  useEffect(() => {
    if (!supabase) return

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }
    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Legacy tasks support for migration
  const [legacyTasks] = useStickyState<Task[]>([], 'c-loom-tasks')

  // 2. Supabase Data Hook
  const {
    boards: remoteBoards,
    categories: remoteCategories,
    isLoading: isRemoteLoading,
    createBoard: createRemoteBoard,
    deleteBoard: deleteRemoteBoard,
    updateBoard: updateRemoteBoard,
    createTask: createRemoteTask,
    updateTask: updateRemoteTask,
    deleteTask: deleteRemoteTask,
    createCategory: createRemoteCategory,
    setBoards: setRemoteBoards,
    syncProfile,
    migrateLocalData,
  } = useSupabaseData(user)

  // 3. Local State (Guest Mode)
  const [localBoards, setLocalBoards, isLocalLoaded] = useStickyState<Board[]>(
    [],
    'c-loom-boards'
  )
  const [localCategories, setLocalCategories] = useStickyState<Category[]>(
    [
      { id: '1', name: 'Work', color: '#3b82f6', workspaceId: 'default' },
      { id: '2', name: 'Personal', color: '#10b981', workspaceId: 'default' },
      { id: '3', name: 'Urgent', color: '#ef4444', workspaceId: 'default' },
    ],
    'c-loom-categories'
  )

  // 4. Combined State
  const isLoaded = user ? !isRemoteLoading : isLocalLoaded
  const boards = user ? remoteBoards : localBoards
  const categories = user ? remoteCategories : localCategories

  // Board Selection State
  const [currentBoardId, setCurrentBoardId] = useStickyState<string>(
    '',
    'c-loom-current-board'
  )

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!isLoaded) return

    if (boards.length === 0) {
      if (!user) {
        const initialBoardId = crypto.randomUUID()
        const initialBoard: Board = {
          id: initialBoardId,
          name: 'Life',
          tasks: legacyTasks.length > 0 ? legacyTasks : [],
          createdAt: new Date().toISOString(),
          userId: 'local',
        }
        setLocalBoards([initialBoard])
        setCurrentBoardId(initialBoardId)
      }
    } else if (
      !currentBoardId ||
      !boards.find((b) => b.id === currentBoardId)
    ) {
      if (boards.length > 0) {
        setCurrentBoardId(boards[0].id)
      }
    }
  }, [
    isLoaded,
    boards,
    currentBoardId,
    user,
    setLocalBoards,
    setCurrentBoardId,
    legacyTasks,
  ])

  const syncedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (user?.id && syncedUserIdRef.current !== user.id) {
      syncedUserIdRef.current = user.id
      syncProfile(user)
    }
  }, [user?.id, syncProfile])

  useEffect(() => {
    const performMigration = async () => {
      if (user && localBoards.length > 0) {
        try {
          await migrateLocalData(localBoards, localCategories)
          setLocalBoards([])
          setLocalCategories([])
          console.log('Local data migrated and cleared.')
        } catch (error) {
          console.error('Error migrating local data:', error)
        }
      }
    }

    performMigration()
  }, [
    user,
    // Depend on the array reference or length?
    // Using reference is safer if useStickyState returns stable reference.
    localBoards,
    localCategories,
    migrateLocalData,
    setLocalBoards,
    setLocalCategories,
  ])

  const currentBoard = useMemo(
    () => boards.find((b) => b.id === currentBoardId) || boards[0],
    [boards, currentBoardId]
  )

  const currentTasks = useMemo(() => currentBoard?.tasks || [], [currentBoard])

  const setTasks = (newTasksUpdater: Task[] | ((prev: Task[]) => Task[])) => {
    if (!currentBoard) return

    const updateFn = (prevBoards: Board[]) =>
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

    if (user) {
      // Optimistic updates for remote usually handled in useSupabaseData's functions
      // but here we might need manual setRemoteBoards for collision resolution dragging?
      // Actually useSupabaseData exposes setBoards for this exact reason (optimistic UI).
      setRemoteBoards(updateFn)
    } else {
      setLocalBoards(updateFn)
    }
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

  useCollisionResolution(currentTasks, setTasks, {
    containerWidth: windowSize.width,
    containerHeight: windowSize.height,
    padding: 20,
  })

  useEffect(() => {
    if (!isLoaded || !currentBoard) return

    let hasChanges = false
    const migratedTasks = currentTasks.map((task) => {
      if (task.pos_x === undefined || task.pos_y === undefined) {
        hasChanges = true
        return {
          ...task,
          pos_x: task.pos_x ?? Math.random() * 80 + 10,
          pos_y: task.pos_y ?? Math.random() * 60 + 20,
          createdAt:
            typeof task.createdAt === 'number'
              ? new Date(task.createdAt).toISOString()
              : task.createdAt,
          workspaceId: currentBoardId,
          completed: false, // Default
        }
      }
      return task
    })

    if (hasChanges) {
      if (user) {
        setTasks(migratedTasks)
        // iterate and update remote?
        migratedTasks.forEach((t) => {
          if (
            t.pos_x !== undefined &&
            currentTasks.find(
              (old) => old.id === t.id && old.pos_x === undefined
            )
          ) {
            updateRemoteTask(t.id, { pos_x: t.pos_x, pos_y: t.pos_y })
          }
        })
      } else {
        setTasks(migratedTasks)
      }
    }
  }, [isLoaded, currentBoardId, currentTasks.length, user, updateRemoteTask])

  const addTask = async (
    title: string,
    categoryId: string,
    dueDate?: string,
    recurrence: TaskRecurrence = 'never',
    priority?: number,
    icon?: string
  ) => {
    if (!title.trim() || !currentBoard) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      createdAt: new Date().toISOString(),
      pos_x: Math.random() * 80 + 10,
      pos_y: Math.random() * 60 + 20,
      categoryId,
      workspaceId: currentBoardId,
      completed: false,
      deadline: dueDate || undefined,
      description: '',
      recurrence,
      priority: priority ?? 0,
    }

    if (user) {
      await createRemoteTask(newTask)
    } else {
      setTasks((prev) => [...prev, newTask])
    }
  }

  const addCategory = async (name: string, color: string, icon?: string) => {
    if (!currentBoard) return

    const newCategory: Omit<Category, 'workspaceId'> = {
      id: crypto.randomUUID(),
      name,
      color,
      icon,
    }

    if (user) {
      await createRemoteCategory({
        ...newCategory,
        workspaceId: currentBoardId,
      })
    } else {
      setLocalCategories((prev) => [
        ...prev,
        { ...newCategory, workspaceId: currentBoardId },
      ])
    }
  }

  const completeTask = async (id: string) => {
    if (user) {
      await deleteRemoteTask(id, currentBoardId)
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )

    if (user) {
      await updateRemoteTask(id, updates)
    }
  }

  const handleAddBoard = async () => {
    if (user) {
      await createRemoteBoard(`Workspace ${boards.length + 1}`)
    } else {
      const newBoard: Board = {
        id: crypto.randomUUID(),
        name: `Workspace ${boards.length + 1}`,
        tasks: [],
        createdAt: new Date().toISOString(),
        userId: 'local',
      }
      setLocalBoards((prev) => [...prev, newBoard])
      setCurrentBoardId(newBoard.id)
    }
  }

  if (!isLoaded) return null

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar
        boards={boards}
        currentBoardId={currentBoardId}
        user={user}
        onSelectBoard={setCurrentBoardId}
        onAddBoard={handleAddBoard}
        onDeleteBoard={deleteRemoteBoard}
        onRenameBoard={updateRemoteBoard}
      />

      <div className="relative flex h-screen w-full flex-1 flex-col transition-all duration-300">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-indigo-200/20 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[50vh] w-[50vw] rounded-full bg-rose-200/20 blur-[120px]" />
        </div>

        {/* Login CTA for guests - Apple Design */}
        {!user && (
          <div className="pointer-events-none fixed top-0 right-0 z-50 flex w-full justify-end p-4 sm:p-6">
            <button
              onClick={async () => {
                const supabase = createClient()
                if (!supabase) return
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                })
              }}
              className="group pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-[#E5E5EA] px-5 py-3 text-[15px] leading-tight font-semibold text-[#1C1C1E] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:bg-[#D1D1D6] hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_3px_6px_rgba(0,0,0,0.08)] active:scale-[0.98] sm:px-6 sm:py-3.5"
            >
              <svg
                className="h-[18px] w-[18px] sm:h-5 sm:w-5"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Sign in</span>
            </button>
          </div>
        )}

        <div className="pb-safe relative z-30 mx-auto h-[calc(100vh-120px)] w-full max-w-7xl content-center items-center justify-center p-3 sm:h-[calc(100vh-100px)] sm:p-6">
          <AnimatePresence mode="popLayout">
            {currentTasks.map((task) => {
              const category = categories.find((c) => c.id === task.categoryId)
              return (
                <div
                  key={task.id}
                  className="transition-z absolute duration-200 hover:z-50"
                  style={{
                    top: `${task.pos_y}%`,
                    left: `${task.pos_x}%`,
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
              categories={categories}
              open={!!selectedTask}
              onOpenChange={(open) => !open && setSelectedTask(null)}
              onDelete={completeTask}
              onUpdate={updateTask}
            />
          )}

          {currentTasks.length === 0 && (
            <div className="mt-10 animate-pulse px-4 text-center text-slate-300 sm:mt-20">
              <p className="font-geist-pixel-circle text-4xl leading-tight font-medium sm:text-6xl md:text-7xl lg:text-9xl">
                All clear on {currentBoard?.name}.
              </p>
              <p className="fonts-mono mt-2 text-xl opacity-70 sm:text-2xl md:text-3xl lg:text-4xl">
                Focus or Relax.
              </p>
            </div>
          )}
        </div>

        <div className="pointer-events-none fixed bottom-0 left-0 z-40 flex w-full justify-center pt-8 sm:pt-12">
          <div className="pointer-events-auto relative">
            <div className="pointer-events-none absolute inset-0 -top-20 -bottom-4 left-1/2 w-[120%] -translate-x-1/2 bg-gradient-to-t from-white/40 via-white/20 to-transparent backdrop-blur-[2px]" />
            <div className="relative">
              <AddTaskDialog
                categories={categories}
                currentBoard={currentBoard}
                onAddTask={addTask}
                onAddCategory={addCategory}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
