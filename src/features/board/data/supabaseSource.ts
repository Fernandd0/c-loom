import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { BoardDataSource } from './types'
import {
  boardFromRow,
  categoryFromRow,
  categoryToInsert,
  taskFromRow,
  taskToInsert,
  taskToUpdate,
} from './mappers'

type Result<T> = { data: T; error: PostgrestError | null }

function unwrap<T>({ data, error }: Result<T>): T {
  if (error) throw error
  return data
}

function rows<T>(result: Result<T[] | null>): T[] {
  return unwrap(result) ?? []
}

// RLS hides rows instead of failing, so an update that matched nothing is reported as an error.
function expectRows<T>(result: Result<T[] | null>, what: string) {
  if (rows(result).length === 0) throw new Error(`${what} not found`)
}

export function createSupabaseSource(
  supabase: SupabaseClient<Database>,
  userId: string
): BoardDataSource {
  return {
    async load() {
      const [workspaces, categories, tasks] = await Promise.all([
        supabase.from('workspaces').select('*').order('created_at'),
        supabase.from('categories').select('*').order('created_at'),
        supabase.from('tasks').select('*').order('created_at'),
      ])

      const allTasks = rows(tasks).map(taskFromRow)
      return {
        boards: rows(workspaces).map((ws) =>
          boardFromRow(
            ws,
            allTasks.filter((t) => t.workspaceId === ws.id)
          )
        ),
        categories: rows(categories).map(categoryFromRow),
      }
    },

    async createBoard(board) {
      unwrap(
        await supabase
          .from('workspaces')
          .insert({ id: board.id, user_id: userId, name: board.name })
      )
      // A database trigger seeds the default categories for every new workspace.
      const seeded = rows(
        await supabase
          .from('categories')
          .select('*')
          .eq('workspace_id', board.id)
      )
      return seeded.map(categoryFromRow)
    },

    async deleteBoard(boardId) {
      // Categories and tasks cascade in the database.
      unwrap(await supabase.from('workspaces').delete().eq('id', boardId))
    },

    async renameBoard(boardId, name) {
      expectRows(
        await supabase
          .from('workspaces')
          .update({ name })
          .eq('id', boardId)
          .select('id'),
        'Workspace'
      )
    },

    async createTask(task) {
      unwrap(await supabase.from('tasks').insert(taskToInsert(task)))
    },

    async updateTask(taskId, updates) {
      expectRows(
        await supabase
          .from('tasks')
          .update(taskToUpdate(updates))
          .eq('id', taskId)
          .select('id'),
        'Task'
      )
    },

    async deleteTask(taskId) {
      // Deleting an already-deleted task is fine (e.g. a double click), so no row check.
      unwrap(await supabase.from('tasks').delete().eq('id', taskId))
    },

    async createCategory(category) {
      unwrap(
        await supabase.from('categories').insert(categoryToInsert(category))
      )
    },
  }
}
