// Runs against the real Supabase project in .env. Creates throwaway users and deletes them.
// Skipped when SUPABASE_SERVICE_ROLE_KEY isn't available (e.g. CI without secrets).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { createSupabaseSource } from '@/features/board/data/supabaseSource'
import type { BoardDataSource, SharingApi } from '@/features/board/data/types'
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
  sharing: SharingApi
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
    const source = createSupabaseSource(client, data.user.id)
    return { id: data.user.id, client, source, sharing: source.sharing! }
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

  describe('shared workspaces', () => {
    let owner: TestUser
    let editor: TestUser
    let stranger: TestUser
    let shared: string

    const share = async (workspaceId: string, user: TestUser) => {
      // Joining by link comes later; until then the service role adds the member.
      const { error } = await admin
        .from('workspace_members')
        .insert({ workspace_id: workspaceId, user_id: user.id, role: 'editor' })
      if (error) throw error
    }
    const hasBoard = async (user: TestUser, id: string) =>
      (await user.source.load()).boards.some((w) => w.id === id)

    beforeAll(async () => {
      owner = await newUser('owner')
      editor = await newUser('editor')
      stranger = await newUser('stranger')
      shared = crypto.randomUUID()
      await owner.source.createBoard({
        id: shared,
        name: 'Trip',
        tasks: [],
        createdAt: new Date().toISOString(),
        userId: owner.id,
      })
      await share(shared, editor)
    })

    it('makes the creator of every workspace its owner member', async () => {
      const { data } = await owner.client
        .from('workspace_members')
        .select('workspace_id, user_id, role')
        .eq('user_id', owner.id)
      const { boards } = await owner.source.load()
      expect(data).toHaveLength(boards.length)
      expect(data!.every((m) => m.role === 'owner')).toBe(true)
    })

    it('lets an editor work on tasks and categories, and see the members', async () => {
      const task = newTask(shared, { title: 'Book flights' })
      await owner.source.createTask(task)

      const view = await editor.source.load()
      const board = view.boards.find((w) => w.id === shared)
      expect(board?.tasks.map((t) => t.title)).toEqual(['Book flights'])
      expect(view.categories.some((c) => c.workspaceId === shared)).toBe(true)

      await editor.source.updateTask(task.id, { title: 'Book cheap flights' })
      const category = {
        id: crypto.randomUUID(),
        name: 'Packing',
        color: '#FF9500',
        workspaceId: shared,
      }
      await editor.source.createCategory(category)
      const mine = newTask(shared, { categoryId: category.id })
      await editor.source.createTask(mine)
      await editor.source.renameBoard(shared, 'Summer trip')

      const ownerView = await owner.source.load()
      const ownerBoard = ownerView.boards.find((w) => w.id === shared)!
      expect(ownerBoard.name).toBe('Summer trip')
      expect(ownerBoard.tasks.map((t) => t.title).sort()).toEqual([
        'Book cheap flights',
        'integration test',
      ])

      await editor.source.deleteTask(mine.id)
      expect(
        (await owner.source.load()).boards
          .find((w) => w.id === shared)!
          .tasks.some((t) => t.id === mine.id)
      ).toBe(false)

      const { data: members } = await editor.client
        .from('workspace_members')
        .select('user_id, role')
        .eq('workspace_id', shared)
      expect(members).toHaveLength(2)
    })

    it('keeps owner-only actions away from editors', async () => {
      // Deleting the workspace matches nothing for an editor.
      await editor.source.deleteBoard(shared)
      expect(await hasBoard(owner, shared)).toBe(true)

      // The owner can't be changed: only the name is updatable.
      const takeover = await editor.client
        .from('workspaces')
        .update({ user_id: editor.id })
        .eq('id', shared)
      expect(takeover.error).not.toBeNull()

      // Nobody adds members directly, and the owner row can't be removed.
      const invite = await editor.client
        .from('workspace_members')
        .insert({ workspace_id: shared, user_id: stranger.id, role: 'editor' })
      expect(invite.error).not.toBeNull()
      await editor.client
        .from('workspace_members')
        .delete()
        .eq('workspace_id', shared)
        .eq('user_id', owner.id)
      const promote = await editor.client
        .from('workspace_members')
        .update({ role: 'owner' })
        .eq('workspace_id', shared)
        .eq('user_id', editor.id)
        .select('role')
      expect(promote.data ?? []).toEqual([])
      const { data: roles } = await admin
        .from('workspace_members')
        .select('user_id, role')
        .eq('workspace_id', shared)
      expect(
        Object.fromEntries(roles!.map((m) => [m.user_id, m.role]))
      ).toEqual({ [owner.id]: 'owner', [editor.id]: 'editor' })
    })

    it('shows nothing to non-members', async () => {
      expect(await hasBoard(stranger, shared)).toBe(false)
      const { data } = await stranger.client
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', shared)
      expect(data ?? []).toEqual([])
      await expect(
        stranger.source.createTask(newTask(shared))
      ).rejects.toThrow()
    })

    it('never imports guest tasks into a galaxy shared with you', async () => {
      const guestBoardId = crypto.randomUUID()
      await editor.source.importGuest!({
        boards: [
          {
            id: guestBoardId,
            name: 'Summer trip',
            createdAt: new Date().toISOString(),
            userId: 'local',
            tasks: [newTask(guestBoardId, { title: 'Guest task' })],
          },
        ],
        categories: [],
      })
      const { boards } = await editor.source.load()
      const trips = boards.filter((w) => w.name === 'Summer trip')
      expect(trips).toHaveLength(2)
      expect(
        trips
          .find((w) => w.id === shared)!
          .tasks.some((t) => t.title === 'Guest task')
      ).toBe(false)
      expect(
        trips.find((w) => w.userId === editor.id)!.tasks.map((t) => t.title)
      ).toEqual(['Guest task'])
    })

    it('lets an editor leave and the owner remove editors', async () => {
      await editor.client
        .from('workspace_members')
        .delete()
        .eq('workspace_id', shared)
        .eq('user_id', editor.id)
      expect(await hasBoard(editor, shared)).toBe(false)

      await share(shared, stranger)
      expect(await hasBoard(stranger, shared)).toBe(true)
      await owner.client
        .from('workspace_members')
        .delete()
        .eq('workspace_id', shared)
        .eq('user_id', stranger.id)
      expect(await hasBoard(stranger, shared)).toBe(false)
      expect(await hasBoard(owner, shared)).toBe(true)
    })
  })

  describe('sharing', () => {
    let owner: TestUser
    let editor: TestUser
    let stranger: TestUser
    let galaxy: string
    let token: string

    const boardOf = async (user: TestUser) =>
      (await user.source.load()).boards.find((w) => w.id === galaxy)
    // Resolves once `check` passes, polling for realtime callbacks.
    const eventually = async (check: () => boolean, ms = 10_000) => {
      const start = Date.now()
      while (!check()) {
        if (Date.now() - start > ms) throw new Error('Timed out')
        await new Promise((r) => setTimeout(r, 100))
      }
    }

    beforeAll(async () => {
      owner = await newUser('share-owner')
      editor = await newUser('share-editor')
      stranger = await newUser('share-stranger')
      galaxy = crypto.randomUUID()
      await owner.source.createBoard({
        id: galaxy,
        name: 'House',
        tasks: [],
        createdAt: new Date().toISOString(),
        userId: owner.id,
      })
    })

    it('joins with the link, and only the owner manages it', async () => {
      expect(await owner.sharing.invite(galaxy)).toBeNull()
      token = await owner.sharing.resetInvite(galaxy)
      expect(token).toMatch(/^[0-9a-f]{64}$/)
      // Asking again returns the same link.
      expect(await owner.sharing.invite(galaxy)).toBe(token)

      await expect(editor.sharing.join('not-a-token')).rejects.toThrow()
      expect(await editor.sharing.join(token)).toBe(galaxy)
      expect(await editor.sharing.join(token)).toBe(galaxy) // twice is fine
      expect((await boardOf(editor))?.memberCount).toBe(2)

      // Editors can't read or change the link.
      expect(await editor.sharing.invite(galaxy)).toBeNull()
      await expect(editor.sharing.resetInvite(galaxy)).rejects.toThrow()
      await editor.sharing.stopSharing(galaxy)
      expect(await owner.sharing.invite(galaxy)).toBe(token)

      const members = await editor.sharing.members(galaxy)
      expect(members.map((m) => [m.userId, m.role])).toEqual([
        [owner.id, 'owner'],
        [editor.id, 'editor'],
      ])
      expect(await stranger.sharing.members(galaxy)).toEqual([])
    })

    it('resetting or stopping the link locks newcomers out', async () => {
      const fresh = await owner.sharing.resetInvite(galaxy)
      expect(fresh).not.toBe(token)
      await expect(stranger.sharing.join(token)).rejects.toThrow()

      await owner.sharing.stopSharing(galaxy)
      expect(await owner.sharing.invite(galaxy)).toBeNull()
      await expect(stranger.sharing.join(fresh)).rejects.toThrow()
      expect(await boardOf(stranger)).toBeUndefined()
      // Members already in stay.
      expect(await boardOf(editor)).toBeDefined()
    })

    it('keeps a separate layout for each member', async () => {
      const task = newTask(galaxy, { pos_x: 50, pos_y: 50 })
      await owner.source.createTask(task)
      await owner.source.savePositions([{ id: task.id, pos_x: 10, pos_y: 20 }])
      await editor.source.savePositions([{ id: task.id, pos_x: 80, pos_y: 70 }])

      const at = async (user: TestUser) => {
        const t = (await boardOf(user))!.tasks.find((t) => t.id === task.id)!
        return [t.pos_x, t.pos_y]
      }
      expect(await at(owner)).toEqual([10, 20])
      expect(await at(editor)).toEqual([80, 70])

      // A non-member can't place someone else's task.
      await stranger.source.savePositions([{ id: task.id, pos_x: 1, pos_y: 1 }])
      const { data } = await admin
        .from('task_positions')
        .select('user_id')
        .eq('task_id', task.id)
      expect(data!.map((r) => r.user_id).sort()).toEqual(
        [owner.id, editor.id].sort()
      )
    })

    it('records who completed what, in one step', async () => {
      const once = newTask(galaxy, { title: 'Take out trash' })
      const weekly = newTask(galaxy, {
        title: 'Water plants',
        recurrence: 'weekly',
        deadline: '2026-10-28T22:59:00.000Z',
      })
      await owner.source.createTask(once)
      await owner.source.createTask(weekly)

      // A stranger completing changes nothing.
      await stranger.source.completeTask(once.id, null)
      await editor.source.completeTask(once.id, null)
      await editor.source.completeTask(once.id, null) // double click
      await editor.source.completeTask(weekly.id, {
        deadline: '2026-11-04T23:59:00.000Z',
        recurrenceAnchor: '2026-10-28T22:59:00.000Z',
        createdAt: '2026-10-28T12:00:00.000Z',
      })

      const tasks = (await boardOf(owner))!.tasks
      expect(tasks.some((t) => t.id === once.id)).toBe(false)
      const moved = tasks.find((t) => t.id === weekly.id)!
      expect(new Date(moved.deadline!).toISOString()).toBe(
        '2026-11-04T23:59:00.000Z'
      )

      const history = await owner.sharing.completions(galaxy)
      expect(history.map((c) => c.title).sort()).toEqual([
        'Take out trash',
        'Water plants',
      ])
      expect(history.every((c) => c.completedBy === editor.id)).toBe(true)
      expect(await stranger.sharing.completions(galaxy)).toEqual([])

      // History can't be written or edited directly.
      const forged = await editor.client.from('task_completions').insert({
        workspace_id: galaxy,
        task_id: crypto.randomUUID(),
        title: 'fake',
      })
      expect(forged.error).not.toBeNull()
    })

    it('pushes changes and completions to other members live', async () => {
      let reloads = 0
      const completed: string[] = []
      const stopBoard = owner.source.subscribe!(() => reloads++)
      const stopCompletions = owner.sharing.watchCompletions((c) =>
        completed.push(c.title)
      )
      await owner.source.load()

      // Channels take a moment to join, so keep making changes until one gets through.
      let task = newTask(galaxy, { title: 'Fix the door' })
      for (let i = 0; reloads === 0 && i < 10; i++) {
        task = newTask(galaxy, { title: 'Fix the door' })
        await editor.source.createTask(task)
        await new Promise((r) => setTimeout(r, 1500))
      }
      expect(reloads).toBeGreaterThan(0)

      await editor.source.completeTask(task.id, null)
      await eventually(() => completed.includes('Fix the door'))

      stopBoard()
      stopCompletions()
    })

    it('lets only members see who is online', async () => {
      const seen: string[][] = []
      const me = { userId: owner.id, name: 'Owner' }
      const stop = owner.sharing.watchPresence(galaxy, me, (people) =>
        seen.push(people.map((p) => p.userId))
      )
      await eventually(() => seen.some((ids) => ids.includes(owner.id)))
      stop()

      const strangerSeen: string[][] = []
      const stopStranger = stranger.sharing.watchPresence(
        galaxy,
        { userId: stranger.id },
        (people) => strangerSeen.push(people.map((p) => p.userId))
      )
      await new Promise((r) => setTimeout(r, 3000))
      stopStranger()
      expect(strangerSeen.flat()).not.toContain(owner.id)
      expect(strangerSeen.flat()).not.toContain(stranger.id)
    })

    it('lets an editor leave', async () => {
      await editor.sharing.leave(galaxy)
      expect(await boardOf(editor)).toBeUndefined()
      await expect(editor.sharing.leave(galaxy)).rejects.toThrow()
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
