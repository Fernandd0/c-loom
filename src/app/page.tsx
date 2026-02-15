'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStickyState } from './hooks/useStickyState'
import { useCollisionResolution } from './hooks/useCollisionResolution'
import TaskCircle from './components/TaskCircle'
import { Task, Category, Board } from './types'
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

  // 5. Initialize / Default Board Logic
  useEffect(() => {
    if (!isLoaded) return

    if (boards.length === 0) {
      if (!user) {
        // Only create default local board if guest
        const initialBoardId = crypto.randomUUID()
        const initialBoard: Board = {
          id: initialBoardId,
          name: 'Home',
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

  // 6. Sync Profile (Once per user)
  const syncedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (user?.id && syncedUserIdRef.current !== user.id) {
      syncedUserIdRef.current = user.id
      syncProfile(user)
    }
  }, [user?.id, syncProfile])

  // 7. Migrate Data on Login
  useEffect(() => {
    const performMigration = async () => {
      // Check if user is logged in and there are local boards to migrate
      if (user && localBoards.length > 0) {
        try {
          await migrateLocalData(localBoards, localCategories)
          // Clear local data after successful migration
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

  // 8. Computed Current State
  const currentBoard = useMemo(
    () => boards.find((b) => b.id === currentBoardId) || boards[0],
    [boards, currentBoardId]
  )

  const currentTasks = useMemo(() => currentBoard?.tasks || [], [currentBoard])

  // Helper to update current board's tasks (Abstracts local vs remote)
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

  // Window Resize
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

  // Collision Resolution
  useCollisionResolution(currentTasks, setTasks, {
    containerWidth: windowSize.width,
    containerHeight: windowSize.height,
    padding: 20,
  })

  // Ensure tasks have positions (Migration/Safety)
  useEffect(() => {
    if (!isLoaded || !currentBoard) return

    let hasChanges = false
    const migratedTasks = currentTasks.map((task) => {
      if (task.pos_x === undefined || task.pos_y === undefined) {
        hasChanges = true
        return {
          ...task,
          pos_x: (task as any).x ?? Math.random() * 80 + 10,
          pos_y: (task as any).y ?? Math.random() * 60 + 20,
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
      // Update local state or trigger remote update?
      // Since setTasks handles both via setBoards, this updates the state.
      // But for remote, we might want to save these positions permanently?
      // The updateRemoteTask in useSupabaseData would persist it.
      // But setTasks only updates local state (optimistic).
      // If we want to persist migration:
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
            updateRemoteTask(t)
          }
        })
      } else {
        setTasks(migratedTasks)
      }
    }
  }, [isLoaded, currentBoardId, currentTasks.length, user, updateRemoteTask]) // Added updateRemoteTask to deps

  // Actions
  const addTask = async (
    title: string,
    categoryId: string,
    durationMinutes?: number
  ) => {
    if (!title.trim() || !currentBoard) return

    const now = Date.now()
    const deadline = durationMinutes
      ? new Date(now + durationMinutes * 60 * 1000).toISOString()
      : undefined

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      createdAt: new Date(now).toISOString(),
      pos_x: Math.random() * 80 + 10,
      pos_y: Math.random() * 60 + 20,
      categoryId,
      workspaceId: currentBoardId,
      completed: false,
      deadline,
      description: '', // Def
    }

    if (user) {
      await createRemoteTask(newTask)
    } else {
      setTasks((prev) => [...prev, newTask])
    }
  }

  const addCategory = async (category: Omit<Category, 'workspaceId'>) => {
    if (user) {
      await createRemoteCategory({ ...category, workspaceId: currentBoardId })
    } else {
      setLocalCategories((prev) => [
        ...prev,
        { ...category, workspaceId: currentBoardId },
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

        {/* <div className="relative z-30 flex w-full items-center px-6 pt-6">
          <h1 className="font-mono text-xl font-normal tracking-wide text-slate-700">
            C-LOOM
          </h1>
        </div> */}

        <div className="relative z-30 mx-auto h-[calc(100vh-100px)] w-full max-w-7xl content-center items-center justify-center p-6">
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
              open={!!selectedTask}
              onOpenChange={(open) => !open && setSelectedTask(null)}
              onDelete={completeTask}
            />
          )}

          {currentTasks.length === 0 && (
            <div className="mt-20 animate-pulse text-center text-slate-300">
              <p className="font-geist-pixel-circle text-9xl font-medium">
                All clear on {currentBoard?.name}.
              </p>
              <p className="fonts-mono text-4xl opacity-70">Focus or Relax.</p>
            </div>
          )}
        </div>

        {/* Floating Action Button area */}
        <div className="pointer-events-none fixed bottom-0 left-0 z-40 flex w-full justify-center pt-10">
          <div className="pointer-events-auto">
            <AddTaskDialog
              categories={categories}
              currentBoard={currentBoard}
              onAddTask={addTask}
              onAddCategory={addCategory}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
