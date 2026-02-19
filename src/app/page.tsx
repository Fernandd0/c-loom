'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStickyState } from './hooks/useStickyState'
import { useCollisionResolution } from './hooks/useCollisionResolution'
import TaskCircle from './components/TaskCircle'
import { Task, Category, Board, TaskRecurrence } from './types'
import { AddTaskDialog } from './components/AddTaskDialog'
import { TaskDetailDialog } from './components/TaskDetailDialog'
import { Sidebar } from './components/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useSupabaseData } from './hooks/useSupabaseData'
import { useLocalData } from './hooks/useLocalData'
import { Loader } from '@/components/ui/loader'
import { LandingPage } from './components/LandingPage'

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

  // 2. Data Hooks
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
  } = useSupabaseData(user)

  const {
    boards: localBoards,
    categories: localCategories,
    isLoaded: isLocalLoaded,
    createBoard: createLocalBoard,
    deleteBoard: deleteLocalBoard,
    updateBoard: updateLocalBoard,
    createTask: createLocalTask,
    updateTask: updateLocalTask,
    deleteTask: deleteLocalTask,
    createCategory: createLocalCategory,
    setBoards: setLocalBoards,
  } = useLocalData()

  // 3. Combined State
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

  // Auto-select board logic
  useEffect(() => {
    if (!isLoaded) return

    if (boards.length > 0) {
      if (!currentBoardId || !boards.find((b) => b.id === currentBoardId)) {
        setCurrentBoardId(boards[0].id)
      }
    }
  }, [isLoaded, boards, currentBoardId, setCurrentBoardId])

  const syncedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (user?.id && syncedUserIdRef.current !== user.id) {
      syncedUserIdRef.current = user.id
      syncProfile(user)
    }
  }, [user?.id, syncProfile])

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
    priority?: number
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
      createLocalTask(newTask)
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
      createLocalCategory({ ...newCategory, workspaceId: currentBoardId })
    }
  }

  const completeTask = async (id: string) => {
    if (user) {
      await deleteRemoteTask(id, currentBoardId)
    } else {
      deleteLocalTask(id)
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    // Optimistic update done in hook for local, or via setTasks via hooks?
    // page.tsx has local setTasks which updates Generic State.
    // But now we have hooks.
    // The hooks have their own setters.
    // Let's use the hooks directly.
    if (user) {
      // remote hook handles optimistic internally via setRemoteBoards
      await updateRemoteTask(id, updates)
    } else {
      updateLocalTask(id, updates)
    }
  }

  const handleCreateWorkspace = async () => {
    const newBoard = await createLocalBoard('My Workspace')
    if (newBoard) setCurrentBoardId(newBoard.id)
  }

  const handleAddBoard = async () => {
    if (user) {
      await createRemoteBoard(`Workspace ${boards.length + 1}`)
    } else {
      const newBoard = await createLocalBoard(`Workspace ${boards.length + 1}`)
      if (newBoard) setCurrentBoardId(newBoard.id)
    }
  }

  // deleteLocalBoard is now part of the hook, but we need a wrapper to potentially update currentBoardId
  const handleDeleteLocalBoard = (boardId: string) => {
    deleteLocalBoard(boardId)
    // Board switching is handled by useEffect
  }

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
        <Loader />
      </div>
    )
  }

  // Show Landing Page if no boards (both guest and user)
  if (boards.length === 0) {
    return (
      <LandingPage
        onCreateWorkspace={user ? handleAddBoard : handleCreateWorkspace}
        user={user}
      />
    )
  }

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar
        boards={boards}
        currentBoardId={currentBoardId}
        user={user}
        onSelectBoard={setCurrentBoardId}
        onAddBoard={handleAddBoard}
        onDeleteBoard={user ? deleteRemoteBoard : handleDeleteLocalBoard}
        onRenameBoard={user ? updateRemoteBoard : updateLocalBoard}
      />

      <div className="relative flex h-screen w-full flex-1 flex-col transition-all duration-300">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-indigo-200/20 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[50vh] w-[50vw] rounded-full bg-rose-200/20 blur-[120px]" />
        </div>

        {/* Login CTA removed as it's now in Landing Page/Sidebar */}

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
