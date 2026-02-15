import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Board, Task, Category } from '../types'
import { User } from '@supabase/supabase-js'
import * as workspaceService from '@/services/supabase/workspaceService'
import * as categoryService from '@/services/supabase/categoryService'
import * as taskService from '@/services/supabase/taskService'
import * as profileService from '@/services/supabase/profileService'

export function useSupabaseData(user: User | null) {
  const [boards, setBoards] = useState<Board[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!user || !supabase) return

    setIsLoading(true)
    try {
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: true })

      if (wsError) throw wsError

      const { data: cats, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true })

      if (catError) throw catError

      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true })

      if (taskError) throw taskError

      const formattedBoards: Board[] = workspaces.map((ws) => ({
        id: ws.id,
        name: ws.name,
        userId: ws.user_id,
        createdAt: ws.created_at,
        tasks: tasks
          .filter((t) => t.workspace_id === ws.id)
          .map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            createdAt: t.created_at,
            pos_x: t.pos_x,
            pos_y: t.pos_y,
            categoryId: t.category_id,
            workspaceId: t.workspace_id,
            completed: t.completed,
            deadline: t.deadline,
            recurrence: t.recurrence || 'never',
          })),
      }))

      const formattedCategories: Category[] = cats.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        workspaceId: c.workspace_id,
      }))

      setBoards(formattedBoards)
      setCategories(formattedCategories)
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
    if (!user || !supabase) return null
    
    const newBoard = await workspaceService.createWorkspace(supabase, user.id, name)

    if (newBoard) {
      setBoards((prev) => [...prev, newBoard])
    }
    return newBoard
  }

  const deleteBoard = async (boardId: string) => {
    if (!user || !supabase) return

    // Optimistic update
    setBoards((prev) => prev.filter((b) => b.id !== boardId))

    const success = await workspaceService.deleteWorkspace(supabase, boardId)
    if (!success) {
       // Revert or fetch data
       fetchData() 
    }
  }

  const updateBoard = async (boardId: string, name: string) => {
    if (!user || !supabase) return

    // Optimistic update
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, name } : b))
    )

    await workspaceService.updateWorkspace(supabase, boardId, name)
  }

  const createTask = async (task: Task) => {
    if (!user || !supabase) return
    
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
      if (!user || !supabase) return
      
      // Find the task to get its workspaceId
      let workspaceId = ''
      for (const board of boards) {
        const task = board.tasks.find(t => t.id === taskId)
        if (task) {
          workspaceId = task.workspaceId
          break
        }
      }

      // Optimistic update
      setBoards((prev) =>
        prev.map((b) =>
          b.id === workspaceId
            ? { ...b, tasks: b.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)) }
            : b
        )
      )

      await taskService.updateTask(supabase, taskId, updates)
  }

  const deleteTask = async (taskId: string, workspaceId: string) => {
      if (!user || !supabase) return

      // Optimistic
      setBoards(prev => prev.map(b => b.id === workspaceId ? { ...b, tasks: b.tasks.filter(t => t.id !== taskId)} : b))

      await taskService.deleteTask(supabase, taskId)
  }

  const createCategory = async (category: Category) => {
    if (!user || !supabase ) return
    
    const success = await categoryService.createCategory(supabase, category)

    if (success) {
        setCategories(prev => [...prev, category])
    }
  }

  const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
      if (!user || !supabase) return

      // Optimistic
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updates } : c))

      await categoryService.updateCategory(supabase, categoryId, updates)
  }

  const deleteCategory = async (categoryId: string) => {
      if (!user || !supabase) return

      // Optimistic
      setCategories(prev => prev.filter(c => c.id !== categoryId))

      await categoryService.deleteCategory(supabase, categoryId)
  }

  // In-memory lock to prevent race conditions
  const syncInProgress = useRef<Set<string>>(new Set())

  const syncProfile = async (user: User) => {
      // Guard 1: Check sessionStorage (persists across component re-renders)
      const syncKey = `synced_${user.id}`
      if (typeof window !== 'undefined' && sessionStorage.getItem(syncKey)) {
        console.log('[Sync] Already synced this session, skipping')
        return
      }

      // Guard 2: Check in-memory lock (prevents race conditions)
      if (syncInProgress.current.has(user.id)) {
        console.log('[Sync] Sync already in progress, skipping')
        return
      }

      // Acquire lock
      syncInProgress.current.add(user.id)
      console.log('[Sync] Starting sync for user:', user.id)

      try {
        await profileService.syncUserProfile(user)
        
        // Mark as synced for this session
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(syncKey, 'true')
        }
        
        console.log('[Sync] Sync completed, fetching data')
        // Fetch data to get the workspace (if newly created)
        fetchData()
      } catch (error) {
        console.error('[Sync] Error during sync:', error)
      } finally {
        // Release lock
        syncInProgress.current.delete(user.id)
      }
  }

  // Migration lock to prevent duplicate migrations
  const migrationInProgress = useRef<boolean>(false)

  const migrateLocalData = async (localBoards: Board[], localCategories: Category[]) => {
      if (!user || !supabase) return

      // Guard: Check if migration already completed (persisted in sessionStorage)
      const migrationKey = `migration_completed_${user.id}`
      if (typeof window !== 'undefined' && sessionStorage.getItem(migrationKey)) {
        console.log('[Migration] Already completed in this session, skipping')
        return
      }

      // Guard: Check if migration in progress
      if (migrationInProgress.current) {
        console.log('[Migration] Already in progress, skipping')
        return
      }

      // Guard: Check if there's actually data to migrate
      if (localBoards.length === 0) {
        console.log('[Migration] No local boards to migrate')
        return
      }

      // Acquire lock
      migrationInProgress.current = true
      console.log('[Migration] Starting migration...', localBoards.length, 'boards')

      try {
        for (const board of localBoards) {
            // 1. Create Workspace for board
            const { data: wsData, error: wsError } = await supabase
                .from('workspaces')
                .insert({ 
                    user_id: user.id, 
                    name: board.name 
                })
                .select()
                .single()
            
            if (wsError || !wsData) {
                console.error('[Migration] Failed to migrate board:', board.name, wsError)
                continue
            }

            const newWorkspaceId = wsData.id
            console.log('[Migration] Created workspace:', wsData.name, wsData.id)

            // 2. Migrate Categories
            const categoryMap = new Map<string, string>() // localId -> remoteId

            for (const cat of localCategories) {
                if (cat.workspaceId === 'default' || cat.workspaceId === board.id) {
                   const { data: catData, error: catError } = await supabase
                      .from('categories')
                      .insert({
                          workspace_id: newWorkspaceId,
                          name: cat.name,
                          color: cat.color
                      })
                      .select()
                      .single()
                   
                   if (catData) {
                       categoryMap.set(cat.id, catData.id)
                   }
                }
            }

            // 3. Migrate Tasks
            for (const task of board.tasks) {
                const remoteCategoryId = categoryMap.get(task.categoryId) || null
                
                await supabase.from('tasks').insert({
                    workspace_id: newWorkspaceId,
                    title: task.title,
                    description: task.description || '',
                    pos_x: task.pos_x ?? 50,
                    pos_y: task.pos_y ?? 50,
                    completed: task.completed ?? false,
                    deadline: task.deadline,
                    category_id: remoteCategoryId,
                    created_at: task.createdAt
                })
            }
        }

        // Mark migration as completed in sessionStorage (persists across component remounts)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(migrationKey, 'true')
        }
        
                      
        // Refresh data to show migrated workspaces
        fetchData()
      } catch (error) {
        console.error('[Migration] Error during migration:', error)
      } finally {
        // Release lock
        migrationInProgress.current = false
      }
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
    syncProfile,
    migrateLocalData
  }
}
