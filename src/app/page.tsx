'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import { useBoardData } from '@/features/board/data/useBoardData'
import { GUEST_MODE_KEY } from '@/features/board/data/localSource'
import { useStickyState } from './hooks/useStickyState'
import { useCollisionResolution } from './hooks/useCollisionResolution'
import TaskCircle from './components/TaskCircle'
import { Task, Category, NewTaskInput } from './types'
import { AddTaskDialog } from './components/AddTaskDialog'
import { TaskDetailDialog } from './components/TaskDetailDialog'
import { Sidebar } from './components/Sidebar'
import { LandingPage } from './components/LandingPage'
import { ErrorToast } from './components/ErrorToast'
import { GuestImportBanner } from './components/GuestImportBanner'
import { CategoryBar } from '@/features/board/components/CategoryBar'
import {
  HINTS_KEY,
  OnboardingHints,
} from '@/features/board/components/OnboardingHints'
import { GalaxyText } from '@/features/board/components/GalaxyText'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  // Until the session is known, don't render the guest view: signed-in users would see it flash.
  const [isAuthReady, setIsAuthReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsAuthReady(true)
      }
    }
    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAuthReady(true)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Same API for guests (localStorage) and signed-in users (Supabase).
  const {
    boards,
    categories: allCategories,
    isLoaded,
    error,
    dismissError,
    createBoard,
    deleteBoard,
    renameBoard,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    createCategory,
    updateCategory,
    deleteCategory,
    setBoardTasks,
    guestImport,
    importGuestData,
    dismissGuestImport,
  } = useBoardData(user, isAuthReady)

  const [currentBoardId, setCurrentBoardId] = useStickyState<string>(
    '',
    'c-loom-current-board'
  )
  const [guestMode, setGuestMode] = useStickyState(false, GUEST_MODE_KEY)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  // Keep a valid board selected.
  useEffect(() => {
    if (!isLoaded || boards.length === 0) return
    if (!boards.some((b) => b.id === currentBoardId)) {
      setCurrentBoardId(boards[0].id)
    }
  }, [isLoaded, boards, currentBoardId, setCurrentBoardId])

  const currentBoard = useMemo(
    () => boards.find((b) => b.id === currentBoardId) || boards[0],
    [boards, currentBoardId]
  )
  const currentBoardKey = currentBoard?.id

  // Categories belong to a workspace; guest defaults use the 'default' workspace.
  const categories = useMemo(
    () =>
      allCategories.filter(
        (c) => c.workspaceId === currentBoardKey || c.workspaceId === 'default'
      ),
    [allCategories, currentBoardKey]
  )

  const currentTasks = useMemo(() => currentBoard?.tasks || [], [currentBoard])

  // Focused category: the rest of the board dims. Ignored if it isn't on this board.
  const [categoryFilter, setCategoryFilter] = useStickyState<string>(
    '',
    'c-loom-category-filter'
  )
  const activeFilter = categories.some((c) => c.id === categoryFilter)
    ? categoryFilter
    : ''

  // Hand-drawn pointers on an empty board, while the setting is on (the default).
  // The first click or key hides them for this visit only.
  const [hintsOn] = useStickyState(true, HINTS_KEY)
  const [hintsDismissed, setHintsDismissed] = useState(false)
  const dismissHints = useCallback(() => setHintsDismissed(true), [])

  // Look the task up on every render so the detail dialog reflects saved edits.
  const selectedTask = currentTasks.find((t) => t.id === selectedTaskId)

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const setCurrentTasks = useCallback(
    (tasks: Task[]) => {
      if (currentBoardKey) setBoardTasks(currentBoardKey, tasks)
    },
    [currentBoardKey, setBoardTasks]
  )

  useCollisionResolution(currentTasks, setCurrentTasks, {
    containerWidth: windowSize.width,
    containerHeight: windowSize.height,
    padding: 20,
  })

  const addTask = (input: NewTaskInput) => {
    if (!input.title.trim() || !currentBoard) return
    createTask({
      ...input,
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description ?? '',
      priority: input.priority ?? 0,
      createdAt: new Date().toISOString(),
      pos_x: Math.random() * 80 + 10,
      pos_y: Math.random() * 60 + 20,
      workspaceId: currentBoard.id,
    })
  }

  // Returns the new category's id so the caller can select it right away.
  const addCategory = async (name: string, color: string, icon?: string) => {
    if (!currentBoard) return undefined
    const category: Category = {
      id: crypto.randomUUID(),
      name,
      color,
      icon,
      workspaceId: currentBoard.id,
    }
    createCategory(category)
    return category.id
  }

  const addBoard = () => {
    const name =
      boards.length === 0 ? 'My Galaxy' : `Galaxy ${boards.length + 1}`
    setCurrentBoardId(createBoard(name))
  }

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--page)">
        <Loader />
      </div>
    )
  }

  // Signed-out visitors start on the landing until they choose to use this device,
  // even if old guest data is around. Everyone without a board sees it too.
  if (boards.length === 0 || (!user && !guestMode)) {
    const localTaskCount = user
      ? 0
      : boards.reduce((n, b) => n + b.tasks.length, 0)
    return (
      <>
        <LandingPage
          user={user}
          hasLocalBoards={!user && boards.length > 0}
          localTaskCount={localTaskCount}
          onCreateWorkspace={() => {
            if (!user) setGuestMode(true)
            addBoard()
          }}
          onContinueLocal={() => setGuestMode(true)}
        />
        <ErrorToast message={error} onDismiss={dismissError} />
      </>
    )
  }

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-(--page) selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar
        boards={boards}
        currentBoardId={currentBoardId}
        user={user}
        onSelectBoard={setCurrentBoardId}
        onAddBoard={addBoard}
        onDeleteBoard={deleteBoard}
        onRenameBoard={renameBoard}
      />
      <ErrorToast message={error} onDismiss={dismissError} />
      {guestImport && !error && (
        <GuestImportBanner
          taskCount={guestImport.taskCount}
          isImporting={guestImport.isImporting}
          onImport={importGuestData}
          onDismiss={dismissGuestImport}
        />
      )}

      <div className="relative flex h-screen w-full flex-1 flex-col transition-all duration-300">
        {categories.length > 0 || currentTasks.length > 0 ? (
          <div className="absolute inset-x-0 top-3 z-40 flex justify-center px-14">
            <CategoryBar
              categories={categories}
              tasks={currentTasks}
              filterId={activeFilter}
              onFilterChange={setCategoryFilter}
              onUpdate={updateCategory}
              onDelete={deleteCategory}
              onCreate={addCategory}
            />
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden in-data-[theme=galaxy]:hidden">
          <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-indigo-200/20 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[50vh] w-[50vw] rounded-full bg-rose-200/20 blur-[120px]" />
        </div>

        <div className="pb-safe relative z-30 mx-auto h-[calc(100vh-120px)] w-full max-w-7xl content-center items-center justify-center p-3 sm:h-[calc(100vh-100px)] sm:p-6">
          <AnimatePresence mode="popLayout">
            {currentTasks.map((task) => {
              const category = categories.find((c) => c.id === task.categoryId)
              const dimmed = !!activeFilter && task.categoryId !== activeFilter
              return (
                <div
                  key={task.id}
                  className={cn(
                    'transition-z absolute duration-200 hover:z-50',
                    dimmed && 'opacity-20 grayscale transition-[opacity,filter]'
                  )}
                  style={{
                    top: `${task.pos_y}%`,
                    left: `${task.pos_x}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <TaskCircle
                    task={task}
                    color={category?.color}
                    icon={category?.icon}
                    onComplete={completeTask}
                    onSelect={(t) => setSelectedTaskId(t.id)}
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
              onOpenChange={(open) => !open && setSelectedTaskId(null)}
              onDelete={deleteTask}
              onUpdate={updateTask}
            />
          )}

          {currentTasks.length === 0 && (
            <div className="mt-6 px-2 text-center text-(--dot-soft) sm:mt-10">
              <p className="sr-only">All clear on {currentBoard?.name}.</p>
              <GalaxyText lines={['All clear on', `${currentBoard?.name}.`]} />
              {/* <p className="-mt-2 text-xl opacity-70 sm:-mt-4 sm:text-2xl md:text-3xl">
                Focus or Relax.
              </p> */}
            </div>
          )}
        </div>

        <OnboardingHints
          show={hintsOn && !hintsDismissed && currentTasks.length === 0}
          onDismiss={dismissHints}
        />

        <div className="pointer-events-none fixed bottom-0 left-0 z-40 flex w-full justify-center pt-8 sm:pt-12">
          <div className="pointer-events-auto relative">
            <div className="pointer-events-none absolute inset-0 -top-20 -bottom-4 left-1/2 w-[120%] -translate-x-1/2 bg-gradient-to-t from-white/40 via-white/20 to-transparent backdrop-blur-[2px] in-data-[theme=galaxy]:hidden" />
            <div className="relative">
              <AddTaskDialog
                categories={categories}
                preferredCategoryId={activeFilter}
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
