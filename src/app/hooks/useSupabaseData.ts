import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Board, Task, Category } from '../types'
import { User } from '@supabase/supabase-js'
import * as workspaceService from '@/services/supabase/workspaceService'
import * as categoryService from '@/services/supabase/categoryService'
import * as taskService from '@/services/supabase/taskService'
import {
  boardFromRow,
  categoryFromRow,
  taskFromRow,
} from '@/services/supabase/mappers'

export function useSupabaseData(user: User | null) {
  const [boards, setBoards] = useState<Board[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const [workspaces, cats, tasks] = await Promise.all([
        supabase.from('workspaces').select('*').order('created_at'),
        supabase.from('categories').select('*').order('created_at'),
        supabase.from('tasks').select('*').order('created_at'),
      ])

      if (workspaces.error) throw workspaces.error
      if (cats.error) throw cats.error
      if (tasks.error) throw tasks.error

      const allTasks = tasks.data.map(taskFromRow)

      setBoards(
        workspaces.data.map((ws) =>
          boardFromRow(
            ws,
            allTasks.filter((t) => t.workspaceId === ws.id)
          )
        )
      )
      setCategories(cats.data.map(categoryFromRow))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      fetchData()
    } else {
      setBoards([])
      setCategories([])
      setIsLoading(false)
    }
  }, [user, fetchData])

  const createBoard = async (name: string) => {
    if (!user) return null

    const newBoard = await workspaceService.createWorkspace(
      supabase,
      user.id,
      name
    )

    if (newBoard) {
      setBoards((prev) => [...prev, newBoard])
      // The database seeds default categories for every new workspace.
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('workspace_id', newBoard.id)
      if (data) setCategories((prev) => [...prev, ...data.map(categoryFromRow)])
    }
    return newBoard
  }

  const deleteBoard = async (boardId: string) => {
    if (!user) return

    // Optimistic update
    setBoards((prev) => prev.filter((b) => b.id !== boardId))

    const success = await workspaceService.deleteWorkspace(supabase, boardId)
    if (!success) {
      fetchData()
    }
  }

  const updateBoard = async (boardId: string, name: string) => {
    if (!user) return

    // Optimistic update
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, name } : b))
    )

    await workspaceService.updateWorkspace(supabase, boardId, name)
  }

  const createTask = async (task: Task) => {
    if (!user) return

    const success = await taskService.createTask(supabase, task)

    if (success) {
      setBoards((prev) =>
        prev.map((b) =>
          b.id === task.workspaceId ? { ...b, tasks: [...b.tasks, task] } : b
        )
      )
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return

    // Optimistic update
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        tasks: b.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      }))
    )

    await taskService.updateTask(supabase, taskId, updates)
  }

  const deleteTask = async (taskId: string, workspaceId: string) => {
    if (!user) return

    // Optimistic update
    setBoards((prev) =>
      prev.map((b) =>
        b.id === workspaceId
          ? { ...b, tasks: b.tasks.filter((t) => t.id !== taskId) }
          : b
      )
    )

    await taskService.deleteTask(supabase, taskId)
  }

  const createCategory = async (category: Category) => {
    if (!user) return

    const success = await categoryService.createCategory(supabase, category)

    if (success) {
      setCategories((prev) => [...prev, category])
    }
  }

  const updateCategory = async (
    categoryId: string,
    updates: Partial<Category>
  ) => {
    if (!user) return

    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, ...updates } : c))
    )

    await categoryService.updateCategory(supabase, categoryId, updates)
  }

  const deleteCategory = async (categoryId: string) => {
    if (!user) return

    // Optimistic update
    setCategories((prev) => prev.filter((c) => c.id !== categoryId))

    await categoryService.deleteCategory(supabase, categoryId)
  }

  return {
    boards,
    categories,
    isLoading,
    createBoard,
    deleteBoard,
    updateBoard,
    createTask,
    updateTask,
    deleteTask,
    createCategory,
    setBoards, // exposed for local updates if needed
    setCategories,
    updateCategory,
    deleteCategory,
  }
}
