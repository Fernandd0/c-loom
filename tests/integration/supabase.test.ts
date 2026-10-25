// Runs against the real Supabase project in .env. Creates throwaway users and deletes them.
// Skipped when SUPABASE_SERVICE_ROLE_KEY isn't available (e.g. CI without secrets).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { createSupabaseSource } from '@/features/board/data/supabaseSource'
import type { BoardDataSource } from '@/features/board/data/types'
import type { Task } from '@/app/types'

try {
  process.loadEnvFile('.env')
} catch {
  // No .env file: rely on the environment.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const hasCredentials = !!(
  url &&
  anonKey &&
  serviceKey &&
  !url.includes('placeholder')
)

interface TestUser {
  id: string
  client: SupabaseClient<Database>
  source: BoardDataSource
}

describe.skipIf(!hasCredentials)('Supabase (live project)', () => {
  // Created lazily: a skipped describe still runs this body while collecting tests.
  let admin: SupabaseClient
  const created: string[] = []
  let a: TestUser
  let b: TestUser

  async function newUser(tag: string): Promise<TestUser> {
    const email = `vitest-${tag}-${Date.now()}@example.com`
    const password = `T3st-${crypto.randomUUID()}`
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) throw error
    created.push(data.user.id)
    const client = createClient<Database>(url!, anonKey!, {
      auth: { persistSession: false },
    })
    const signIn = await client.auth.signInWithPassword({ email, password })
    if (signIn.error) throw signIn.error
    return {
      id: data.user.id,
      client,
      source: createSupabaseSource(client, data.user.id),
    }
  }

  const newTask = (workspaceId: string, extra: Partial<Task> = {}): Task => ({
    id: crypto.randomUUID(),
    title: 'integration test',
    description: '',
    createdAt: new Date().toISOString(),
    pos_x: 50,
    pos_y: 50,
    categoryId: '',
    workspaceId,
    recurrence: 'never',
    priority: 0,
    ...extra,
  })

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!, {
      auth: { persistSession: false },
    })
    a = await newUser('a')
    b = await newUser('b')
  })

  afterAll(async () => {
    for (const id of created) await admin.auth.admin.deleteUser(id)
  })

  describe('signup provisioning', () => {
    it('creates the profile, one workspace and two default categories', async () => {
      const { data: profiles } = await a.client.from('profiles').select('id')
      expect(profiles).toEqual([{ id: a.id }])
      const { boards, categories } = await a.source.load()
      expect(boards).toHaveLength(1)
      expect(categories.map((c) => c.name).sort()).toEqual(['Personal', 'Work'])
    })
  })

  describe('row level security', () => {
    it('isolates every table between users', async () => {
      const [{ boards }] = await Promise.all([a.source.load()])
      const task = newTask(boards[0].id)
      await a.source.createTask(task)

      const bView = await b.source.load()
      expect(bView.boards.every((w) => w.userId === b.id)).toBe(true)
      expect(
        bView.boards.flatMap((w) => w.tasks).some((t) => t.id === task.id)
      ).toBe(false)

      const { data: bProfiles } = await b.client.from('profiles').select('id')
      expect(bProfiles).toEqual([{ id: b.id }])
    })

    it("rejects writes to another user's data", async () => {
      const { boards, categories } = await a.source.load()
      const task = newTask(boards[0].id)
      await a.source.createTask(task)

      await expect(
        b.source.updateTask(task.id, { title: 'hacked' })
      ).rejects.toThrow()
      await expect(
        b.source.renameBoard(boards[0].id, 'hacked')
      ).rejects.toThrow()
      await expect(b.source.createTask(newTask(boards[0].id))).rejects.toThrow()

      // Using A's category from B's own workspace is blocked by the composite foreign key.
      const bBoard = (await b.source.load()).boards[0]
      await expect(
        b.source.createTask(
          newTask(bBoard.id, { categoryId: categories[0].id })
        )
      ).rejects.toThrow()

      await expect(
        b.source.updateCategory(categories[0].id, { name: 'hacked' })
      ).rejects.toThrow()
      await b.source.deleteCategory(categories[0].id)
      expect(
        (await a.source.load()).categories.some(
          (c) => c.id === categories[0].id
        )
      ).toBe(true)

      // B deleting A's task silently matches nothing; the task survives.
      await b.source.deleteTask(task.id)
      const after = (await a.source.load()).boards[0].tasks
      expect(after.find((t) => t.id === task.id)?.title).toBe(
        'integration test'
      )
    })

    it('shows nothing to anonymous visitors', async () => {
      const anon = createClient<Database>(url!, anonKey!, {
        auth: { persistSession: false },
      })
      const { data } = await anon.from('tasks').select('id')
      expect(data ?? []).toEqual([])
    })
  })

  describe('supabaseSource', () => {
    it('round-trips every task field and validates constraints', async () => {
      const { boards, categories } = await a.source.load()
      const task = newTask(boards[0].id, {
        description: 'details',
        categoryId: categories[0].id,
        deadline: '2026-10-25T23:30:00.000Z',
        recurrence: 'weekly',
        recurrenceAnchor: '2026-10-18T23:30:00.000Z',
        priority: 7,
      })
      await a.source.createTask(task)
      await a.source.updateTask(task.id, {
        title: 'renamed',
        priority: 10,
        deadline: undefined,
      })
      const saved = (await a.source.load()).boards[0].tasks.find(
        (t) => t.id === task.id
      )
      expect(saved).toMatchObject({
        title: 'renamed',
        priority: 10,
        deadline: undefined,
        recurrence: 'weekly',
        description: 'details',
        categoryId: categories[0].id,
      })
      // Postgres writes the same instant as "+00:00".
      expect(new Date(saved!.recurrenceAnchor!).toISOString()).toBe(
        '2026-10-18T23:30:00.000Z'
      )

      await expect(
        a.source.updateTask(task.id, { priority: 42 })
      ).rejects.toThrow()
      await expect(
        a.source.updateTask(crypto.randomUUID(), { title: 'x' })
      ).rejects.toThrow()
    })

    it('creates a workspace with a client id and seeded categories, and cascades deletes', async () => {
      const id = crypto.randomUUID()
      const seeded = await a.source.createBoard({
        id,
        name: 'Second',
        tasks: [],
        createdAt: new Date().toISOString(),
        userId: a.id,
      })
      expect(seeded).toHaveLength(2)
      expect(seeded.every((c) => c.workspaceId === id)).toBe(true)

      await a.source.createTask(newTask(id))
      await a.source.deleteBoard(id)
      const { boards, categories } = await a.source.load()
      expect(boards.some((w) => w.id === id)).toBe(false)
      expect(categories.some((c) => c.workspaceId === id)).toBe(false)
    })

    it('edits a category and deletes it while keeping its tasks', async () => {
      const { boards } = await a.source.load()
      const category = {
        id: crypto.randomUUID(),
        name: 'Gym',
        color: '#FF9500',
        workspaceId: boards[0].id,
      }
      await a.source.createCategory(category)
      await a.source.updateCategory(category.id, {
        name: 'Fitness',
        color: '#34C759',
        icon: 'dumbbell',
      })
      const task = newTask(boards[0].id, { categoryId: category.id })
      await a.source.createTask(task)

      let data = await a.source.load()
      expect(data.categories.find((c) => c.id === category.id)).toMatchObject({
        name: 'Fitness',
        color: '#34C759',
        icon: 'dumbbell',
      })

      await a.source.deleteCategory(category.id)
      data = await a.source.load()
      expect(data.categories.some((c) => c.id === category.id)).toBe(false)
      expect(
        data.boards[0].tasks.find((t) => t.id === task.id)?.categoryId
      ).toBe('')
    })

    it('saves positions and skips tasks that no longer exist', async () => {
      const { boards } = await a.source.load()
      const task = newTask(boards[0].id)
      await a.source.createTask(task)
      await a.source.savePositions([
        { id: task.id, pos_x: 12.5, pos_y: 87.5 },
        { id: crypto.randomUUID(), pos_x: 1, pos_y: 1 },
      ])
      const saved = (await a.source.load()).boards[0].tasks.find(
        (t) => t.id === task.id
      )
      expect([saved?.pos_x, saved?.pos_y]).toEqual([12.5, 87.5])
    })
  })

  describe('guest import', () => {
    it('merges into the same-named workspace, maps categories and is safe to retry', async () => {
      const user = await newUser('import')
      const guestBoardId = crypto.randomUUID()
      const gymId = crypto.randomUUID()
      const snapshot = {
        boards: [
          {
            id: guestBoardId,
            name: 'My Galaxy',
            createdAt: new Date().toISOString(),
            userId: 'local',
            tasks: [
              newTask(guestBoardId, { title: 'Standup', categoryId: '1' }),
              newTask(guestBoardId, { title: 'Leg day', categoryId: gymId }),
            ],
          },
          // Empty guest boards aren't imported.
          {
            id: crypto.randomUUID(),
            name: 'Empty',
            createdAt: '',
            userId: 'local',
            tasks: [],
          },
        ],
        categories: [
          { id: '1', name: 'Work', color: '#3b82f6', workspaceId: 'default' },
          {
            id: gymId,
            name: 'Gym',
            color: '#FF9500',
            workspaceId: guestBoardId,
          },
        ],
      }

      await user.source.importGuest!(snapshot)
      await user.source.importGuest!(snapshot) // retry must not duplicate

      const { boards, categories } = await user.source.load()
      expect(boards.map((w) => w.name)).toEqual(['My Galaxy'])
      const tasks = boards[0].tasks
      expect(tasks.map((t) => t.title).sort()).toEqual(['Leg day', 'Standup'])

      const byName = (name: string) => categories.filter((c) => c.name === name)
      expect(byName('Work')).toHaveLength(1)
      expect(byName('Gym')).toHaveLength(1)
      expect(tasks.find((t) => t.title === 'Standup')?.categoryId).toBe(
        byName('Work')[0].id
      )
      expect(tasks.find((t) => t.title === 'Leg day')?.categoryId).toBe(
        byName('Gym')[0].id
      )
    })
  })
})
