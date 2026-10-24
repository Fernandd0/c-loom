'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Board, Category, Task } from '@/app/types'
import { BoardDataSource, BoardSnapshot } from './types'
import { localSource } from './localSource'
import { createSupabaseSource } from './supabaseSource'

const GUEST = 'guest'
const EMPTY: BoardSnapshot = { boards: [], categories: [] }
const SAVE_FAILED =
  "Couldn't save your last change. Showing what's actually saved."
const LOAD_FAILED = "Couldn't load your boards. Check your connection."

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

  // Layout-only change (collision resolution): kept in memory, saved for guests via the snapshot.
  const setBoardTasks = useCallback(
    (boardId: string, tasks: Task[]) => {
      if (loadedForRef.current !== mode) return
      const s = snapshotRef.current
      commit({
        ...s,
        boards: s.boards.map((b) => (b.id === boardId ? { ...b, tasks } : b)),
      })
    },
    [mode, commit]
  )

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
    deleteTask,
    createCategory,
    setBoardTasks,
  }
}
