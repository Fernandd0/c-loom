import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'
import { Category } from '@/app/types'
import { overlayPositions } from '../lib/positions'
import { BoardDataSource, Presence, SharingApi } from './types'
import {
  boardFromRow,
  categoryFromRow,
  categoryToInsert,
  categoryToUpdate,
  completionFromRow,
  memberFromRow,
  positionFromRow,
  positionToUpsert,
  taskFromRow,
  taskToInsert,
  taskToUpdate,
} from './mappers'
import { isRelevantChange, RowChange } from './realtime'

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
// Tables whose changes reload the board. Positions are each user's own, so they aren't here.
const WATCHED_TABLES = [
  'tasks',
  'categories',
  'workspaces',
  'workspace_members',
] as const
// A burst of changes (a guest import, a teammate's quick edits) reloads once.
const RELOAD_DEBOUNCE_MS = 300
const HISTORY_LIMIT = 200

export function createSupabaseSource(
  supabase: SupabaseClient<Database>,
  userId: string
): BoardDataSource {
  // Ids from the last load: deletes elsewhere in the app are ignored.
  let knownIds = new Set<string>()

  return {
    async load() {
      const [workspaces, categories, tasks, positions, members] =
        await Promise.all([
          supabase.from('workspaces').select('*').order('created_at'),
          supabase.from('categories').select('*').order('created_at'),
          supabase.from('tasks').select('*').order('created_at'),
          // RLS returns only this user's own layout.
          supabase.from('task_positions').select('task_id, pos_x, pos_y'),
          supabase.from('workspace_members').select('workspace_id'),
        ])

      const allTasks = overlayPositions(
        rows(tasks).map(taskFromRow),
        rows(positions).map(positionFromRow)
      )
      const memberCounts = new Map<string, number>()
      for (const m of rows(members)) {
        memberCounts.set(
          m.workspace_id,
          (memberCounts.get(m.workspace_id) ?? 0) + 1
        )
      }
      const snapshot = {
        boards: rows(workspaces).map((ws) =>
          boardFromRow(
            ws,
            allTasks.filter((t) => t.workspaceId === ws.id),
            memberCounts.get(ws.id) ?? 1
          )
        ),
        categories: rows(categories).map(categoryFromRow),
      }
      knownIds = new Set([
        ...snapshot.boards.map((b) => b.id),
        ...snapshot.categories.map((c) => c.id),
        ...allTasks.map((t) => t.id),
      ])
      return snapshot
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

    async completeTask(taskId, next) {
      unwrap(
        await supabase.rpc('complete_task', {
          p_task_id: taskId,
          p_next_deadline: next?.deadline,
          p_next_anchor: next?.recurrenceAnchor,
          p_next_created_at: next?.createdAt,
        })
      )
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
      // One row each: a task deleted meanwhile (here or by another member) is skipped
      // instead of failing the batch. RLS rejects it (42501) or its key is gone (23503).
      await Promise.all(
        positions.map(async (p) => {
          const { error } = await supabase
            .from('task_positions')
            .upsert(positionToUpsert(p, userId), {
              onConflict: 'task_id,user_id',
            })
          if (error && error.code !== '42501' && error.code !== '23503') {
            throw error
          }
        })
      )
    },

    subscribe(onChange) {
      let timer: ReturnType<typeof setTimeout> | undefined
      const channel = supabase.channel(`boards:${userId}`)
      for (const table of WATCHED_TABLES) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            const change: RowChange = {
              eventType: payload.eventType,
              table,
              old: payload.old,
            }
            if (!isRelevantChange(change, knownIds)) return
            clearTimeout(timer)
            timer = setTimeout(onChange, RELOAD_DEBOUNCE_MS)
          }
        )
      }
      channel.subscribe()
      return () => {
        clearTimeout(timer)
        supabase.removeChannel(channel)
      }
    },

    sharing: createSharing(supabase, userId),

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

function createSharing(
  supabase: SupabaseClient<Database>,
  userId: string
): SharingApi {
  const newToken = async (boardId: string) => {
    const invite = unwrap(
      await supabase
        .from('workspace_invites')
        .upsert(
          {
            workspace_id: boardId,
            // Generated here so a reset gets a fresh one; same format as the default.
            token: (crypto.randomUUID() + crypto.randomUUID()).replaceAll(
              '-',
              ''
            ),
          },
          { onConflict: 'workspace_id' }
        )
        .select('token')
        .single()
    )
    if (!invite) throw new Error('Invite not saved')
    return invite.token
  }

  return {
    async members(boardId) {
      return rows(
        await supabase.rpc('workspace_member_profiles', { ws_id: boardId })
      ).map(memberFromRow)
    },

    async invite(boardId) {
      const existing = unwrap(
        await supabase
          .from('workspace_invites')
          .select('token')
          .eq('workspace_id', boardId)
          .maybeSingle()
      )
      return existing?.token ?? null
    },

    resetInvite: newToken,

    async stopSharing(boardId) {
      unwrap(
        await supabase
          .from('workspace_invites')
          .delete()
          .eq('workspace_id', boardId)
      )
    },

    async join(token) {
      const boardId = unwrap(
        await supabase.rpc('join_workspace', { invite_token: token })
      )
      if (!boardId) throw new Error('Invite not found')
      return boardId
    },

    async removeMember(boardId, memberId) {
      expectRows(
        await supabase
          .from('workspace_members')
          .delete()
          .eq('workspace_id', boardId)
          .eq('user_id', memberId)
          .select('user_id'),
        'Member'
      )
    },

    async leave(boardId) {
      expectRows(
        await supabase
          .from('workspace_members')
          .delete()
          .eq('workspace_id', boardId)
          .eq('user_id', userId)
          .select('user_id'),
        'Membership'
      )
    },

    async completions(boardId) {
      return rows(
        await supabase
          .from('task_completions')
          .select('*')
          .eq('workspace_id', boardId)
          .order('completed_at', { ascending: false })
          .limit(HISTORY_LIMIT)
      ).map(completionFromRow)
    },

    watchCompletions(onCompletion) {
      const channel = supabase
        .channel(`completions:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'task_completions' },
          (payload) => {
            const completion = completionFromRow(
              payload.new as Tables<'task_completions'>
            )
            if (completion.completedBy !== userId) onCompletion(completion)
          }
        )
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    },

    watchPresence(boardId, me, onChange) {
      // Private channel: the database only lets members of this galaxy join it.
      const channel = supabase.channel(`galaxy:${boardId}`, {
        config: { private: true, presence: { key: me.userId } },
      })
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<Presence>()
          onChange(
            Object.values(state).flatMap((sessions) =>
              sessions.slice(0, 1).map(({ userId, name, avatarUrl }) => ({
                userId,
                name,
                avatarUrl,
              }))
            )
          )
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') channel.track(me)
        })
      return () => {
        supabase.removeChannel(channel)
      }
    },
  }
}
