import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { Category } from '@/app/types'
import { BoardDataSource } from './types'
import {
  boardFromRow,
  categoryFromRow,
  categoryToInsert,
  categoryToUpdate,
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Guest defaults use ids like '1'; anything that isn't a UUID gets a new one.
const asUuid = (id: string) => (UUID.test(id) ? id : crypto.randomUUID())
// Insert, or do nothing if the row already exists, so an interrupted import can be retried.
const KEEP_EXISTING = { onConflict: 'id', ignoreDuplicates: true } as const

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

    async updateCategory(categoryId, updates) {
      expectRows(
        await supabase
          .from('categories')
          .update(categoryToUpdate(updates))
          .eq('id', categoryId)
          .select('id'),
        'Category'
      )
    },

    async deleteCategory(categoryId) {
      // Tasks keep going without a category (on delete set null).
      unwrap(await supabase.from('categories').delete().eq('id', categoryId))
    },

    async savePositions(positions) {
      await Promise.all(
        positions.map(async ({ id, pos_x, pos_y }) =>
          unwrap(
            await supabase.from('tasks').update({ pos_x, pos_y }).eq('id', id)
          )
        )
      )
    },

    async importGuest({ boards, categories }) {
      // Only the user's own workspaces: guest tasks never go into a galaxy shared with them.
      const existing = rows(
        await supabase
          .from('workspaces')
          .select('id, name')
          .eq('user_id', userId)
      )

      // Only boards with tasks are worth bringing over.
      for (const board of boards.filter((b) => b.tasks.length > 0)) {
        // Merge into a workspace with the same name (e.g. both have "My Galaxy") instead of duplicating it.
        const target =
          existing.find((w) => w.id === board.id) ??
          existing.find(
            (w) => w.name.toLowerCase() === board.name.toLowerCase()
          )
        const workspaceId = target?.id ?? asUuid(board.id)
        if (!target) {
          unwrap(
            await supabase
              .from('workspaces')
              .upsert(
                { id: workspaceId, user_id: userId, name: board.name },
                KEEP_EXISTING
              )
          )
          existing.push({ id: workspaceId, name: board.name })
        }

        // The new workspace already has the seeded defaults; reuse them by name.
        const available: Category[] = rows(
          await supabase
            .from('categories')
            .select('*')
            .eq('workspace_id', workspaceId)
        ).map(categoryFromRow)
        const categoryIds = new Map<string, string>()

        const guestCategories = categories.filter(
          (c) => c.workspaceId === 'default' || c.workspaceId === board.id
        )
        for (const guest of guestCategories) {
          const match =
            available.find((c) => c.id === guest.id) ??
            available.find(
              (c) => c.name.toLowerCase() === guest.name.toLowerCase()
            )
          if (match) {
            categoryIds.set(guest.id, match.id)
            continue
          }
          const created = { ...guest, id: asUuid(guest.id), workspaceId }
          unwrap(
            await supabase
              .from('categories')
              .upsert(categoryToInsert(created), KEEP_EXISTING)
          )
          categoryIds.set(guest.id, created.id)
          available.push(created)
        }

        unwrap(
          await supabase.from('tasks').upsert(
            board.tasks.map((t) =>
              taskToInsert({
                ...t,
                id: asUuid(t.id),
                workspaceId,
                categoryId: categoryIds.get(t.categoryId) ?? '',
              })
            ),
            KEEP_EXISTING
          )
        )
      }
    },
  }
}
