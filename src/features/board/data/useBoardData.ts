'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Board, Category, Task } from '@/app/types'
import { completionUpdate } from '@/app/lib/task'
import { BoardDataSource, BoardSnapshot, TaskPosition } from './types'
import { clearGuestData, localSource } from './localSource'
import { createSupabaseSource } from './supabaseSource'

const GUEST = 'guest'
const EMPTY: BoardSnapshot = { boards: [], categories: [] }
const SAVE_FAILED =
  "Couldn't save your last change. Showing what's actually saved."
const LOAD_FAILED = "Couldn't load your boards. Check your connection."
const IMPORT_FAILED =
  "Couldn't import your guest tasks. They're still saved on this device."
const IMPORT_DISMISSED_KEY = 'c-loom-guest-import-dismissed'
// Collision resolution settles over a few frames; save positions once it stops moving.
const SAVE_POSITIONS_DELAY_MS = 600

const countTasks = (s: BoardSnapshot) =>
  s.boards.reduce((n, b) => n + b.tasks.length, 0)

const isImportDismissed = () => {
  try {
    return window.sessionStorage.getItem(IMPORT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

type Update = (s: BoardSnapshot) => BoardSnapshot

const mapTasks = (s: BoardSnapshot, fn: (tasks: Task[]) => Task[]) => ({
  ...s,
  boards: s.boards.map((b) => ({ ...b, tasks: fn(b.tasks) })),
})

// Single source of board state for guests and signed-in users.
// Changes show immediately; if the source rejects one, the user is told and state re-syncs from the source.
export function useBoardData(user: User | null, isAuthReady: boolean) {
  const supabase = createClient()
  // Key on the id: the user object changes on every token refresh.
  const userId = user?.id ?? null
  const mode = userId ?? GUEST

  const source: BoardDataSource = useMemo(
    () => (userId ? createSupabaseSource(supabase, userId) : localSource),
    [userId, supabase]
  )

  const [snapshot, setSnapshot] = useState<BoardSnapshot>(EMPTY)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Mirrors of state for synchronous reads inside async mutations.
  const snapshotRef = useRef(EMPTY)
  const loadedForRef = useRef<string | null>(null)

  const commit = useCallback(
    (next: BoardSnapshot) => {
      snapshotRef.current = next
      setSnapshot(next)
      source.saveSnapshot?.(next)
    },
    [source]
  )

  // Load whenever the data owner changes, ignoring responses that arrive after a switch.
  useEffect(() => {
    if (!isAuthReady) return
    let cancelled = false
    loadedForRef.current = null

    const load = () =>
      source
        .load()
        .then((data) => {
          if (cancelled) return
          snapshotRef.current = data
          setSnapshot(data)
        })
        .catch((e) => {
          if (cancelled) return
          console.error('Error loading boards:', e)
          setError(LOAD_FAILED)
        })
        .finally(() => {
          if (cancelled) return
          loadedForRef.current = mode
          setLoadedFor(mode)
        })

    load()
    const unsubscribe = source.subscribe?.(load)
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [isAuthReady, mode, source])

  // Applies a change locally, then persists it. On failure, tells the user and reloads the truth.
  const mutate = useCallback(
    async (update: Update, persist: () => Promise<unknown>) => {
      const owner = loadedForRef.current
      if (owner !== mode) return
      commit(update(snapshotRef.current))
      try {
        await persist()
      } catch (e) {
        console.error('Error saving change:', e)
        if (loadedForRef.current !== owner) return
        setError(SAVE_FAILED)
        try {
          const data = await source.load()
          if (loadedForRef.current === owner) commit(data)
        } catch (reloadError) {
          console.error('Error re-syncing boards:', reloadError)
        }
      }
    },
    [mode, source, commit]
  )

  const createBoard = (name: string) => {
    const board: Board = {
      id: crypto.randomUUID(),
      name,
      tasks: [],
      createdAt: new Date().toISOString(),
      userId: userId ?? 'local',
    }
    mutate(
      (s) => ({ ...s, boards: [...s.boards, board] }),
      async () => {
        const seeded = await source.createBoard(board)
        if (seeded.length > 0 && loadedForRef.current === mode) {
          commit({
            ...snapshotRef.current,
            categories: [...snapshotRef.current.categories, ...seeded],
          })
        }
      }
    )
    // Returned right away so the caller can select the new board.
    return board.id
  }

  const deleteBoard = (boardId: string) =>
    mutate(
      (s) => ({
        boards: s.boards.filter((b) => b.id !== boardId),
        categories: s.categories.filter((c) => c.workspaceId !== boardId),
      }),
      () => source.deleteBoard(boardId)
    )

  const renameBoard = (boardId: string, name: string) =>
    mutate(
      (s) => ({
        ...s,
        boards: s.boards.map((b) => (b.id === boardId ? { ...b, name } : b)),
      }),
      () => source.renameBoard(boardId, name)
    )

  const createTask = (task: Task) =>
    mutate(
      (s) => ({
        ...s,
        boards: s.boards.map((b) =>
          b.id === task.workspaceId ? { ...b, tasks: [...b.tasks, task] } : b
        ),
      }),
      () => source.createTask(task)
    )

  const updateTask = (taskId: string, updates: Partial<Task>) =>
    mutate(
      (s) =>
        mapTasks(s, (tasks) =>
          tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
        ),
      () => source.updateTask(taskId, updates)
    )

  // Recurring tasks move to their next due date; everything else is deleted.
  const completeTask = (taskId: string) => {
    const task = snapshotRef.current.boards
      .flatMap((b) => b.tasks)
      .find((t) => t.id === taskId)
    if (!task) return
    const updates = completionUpdate(task)
    return updates ? updateTask(taskId, updates) : deleteTask(taskId)
  }

  const deleteTask = (taskId: string) =>
    mutate(
      (s) => mapTasks(s, (tasks) => tasks.filter((t) => t.id !== taskId)),
      () => source.deleteTask(taskId)
    )

  const createCategory = (category: Category) =>
    mutate(
      (s) => ({ ...s, categories: [...s.categories, category] }),
      () => source.createCategory(category)
    )

  // Position changes waiting to be saved, keyed by task id.
  const pendingPositions = useRef(new Map<string, TaskPosition>())
  const positionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushPositions = useCallback(() => {
    if (positionsTimer.current) clearTimeout(positionsTimer.current)
    positionsTimer.current = null
    const batch = [...pendingPositions.current.values()]
    pendingPositions.current.clear()
    if (batch.length === 0) return
    // Layout only: a failure isn't worth interrupting the user, the next move retries.
    source
      .savePositions(batch)
      .catch((e) => console.error('Error saving positions:', e))
  }, [source])

  // Save what's pending with the current source before it changes (sign in/out) or on unmount.
  useEffect(() => () => flushPositions(), [flushPositions])

  // Layout-only change (collision resolution): applied now, positions saved once movement settles.
  const setBoardTasks = useCallback(
    (boardId: string, tasks: Task[]) => {
      if (loadedForRef.current !== mode) return
      const s = snapshotRef.current
      const previous = s.boards.find((b) => b.id === boardId)?.tasks ?? []
      for (const t of tasks) {
        const before = previous.find((p) => p.id === t.id)
        if (before && (before.pos_x !== t.pos_x || before.pos_y !== t.pos_y)) {
          pendingPositions.current.set(t.id, {
            id: t.id,
            pos_x: t.pos_x,
            pos_y: t.pos_y,
          })
        }
      }
      commit({
        ...s,
        boards: s.boards.map((b) => (b.id === boardId ? { ...b, tasks } : b)),
      })
      if (pendingPositions.current.size > 0) {
        if (positionsTimer.current) clearTimeout(positionsTimer.current)
        positionsTimer.current = setTimeout(
          flushPositions,
          SAVE_POSITIONS_DELAY_MS
        )
      }
    },
    [mode, commit, flushPositions]
  )

  // After signing in, offer to bring over tasks created as a guest on this device.
  const [guestTaskCount, setGuestTaskCount] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const canImport = !!userId && loadedFor === userId && !!source.importGuest

  useEffect(() => {
    if (!canImport || isImportDismissed()) return
    let cancelled = false
    localSource.load().then((guest) => {
      if (!cancelled) setGuestTaskCount(countTasks(guest))
    })
    return () => {
      cancelled = true
    }
  }, [canImport])

  const importGuestData = async () => {
    if (!source.importGuest || isImporting) return
    const owner = loadedForRef.current
    setIsImporting(true)
    try {
      await source.importGuest(await localSource.load())
      clearGuestData()
      setGuestTaskCount(0)
      const data = await source.load()
      if (loadedForRef.current === owner) commit(data)
    } catch (e) {
      console.error('Error importing guest data:', e)
      setError(IMPORT_FAILED)
    } finally {
      setIsImporting(false)
    }
  }

  // Hides the offer for this browser session; guest data stays on the device.
  const dismissGuestImport = () => {
    try {
      window.sessionStorage.setItem(IMPORT_DISMISSED_KEY, '1')
    } catch {
      // Private mode: the offer just comes back next load.
    }
    setGuestTaskCount(0)
  }

  // Stable so the toast's auto-dismiss timer isn't reset on every render.
  const dismissError = useCallback(() => setError(null), [])

  const isLoaded = isAuthReady && loadedFor === mode
  // Never expose another owner's data while the new one loads.
  const visible = isLoaded ? snapshot : EMPTY

  return {
    boards: visible.boards,
    categories: visible.categories,
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
    setBoardTasks,
    guestImport:
      canImport && guestTaskCount > 0
        ? { taskCount: guestTaskCount, isImporting }
        : null,
    importGuestData,
    dismissGuestImport,
  }
}
