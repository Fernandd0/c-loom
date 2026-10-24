import {
  addTask,
  admin,
  daysFromToday,
  expect,
  hasSupabase,
  signInNewUser,
  test,
  trackConsoleErrors,
} from './helpers'

// Needs a real Supabase project and SUPABASE_SERVICE_ROLE_KEY; skipped otherwise.
test.skip(!hasSupabase, 'Supabase credentials not available')

let cleanup: (() => Promise<unknown>) | undefined
let userId: string

test.beforeEach(async ({ context, baseURL }) => {
  const user = await signInNewUser(context, baseURL!)
  cleanup = user.cleanup
  userId = user.userId
})

test.afterEach(async () => {
  await cleanup?.()
})

const workspaceId = async () => {
  const { data } = await admin()
    .from('workspaces')
    .select('id')
    .eq('user_id', userId)
  return data![0].id as string
}

test('lands straight on the seeded workspace, without a guest flash', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByText('All clear on My Workspace')).toBeVisible()
  await expect(page.getByText('Create Workspace')).toHaveCount(0)
})

test('saves tasks to Supabase and completes them there', async ({ page }) => {
  const errors = trackConsoleErrors(page)
  await page.goto('/')
  await addTask(page, 'Remote task', { due: 'Today', priority: 'Critical' })
  await addTask(page, 'Daily standup', { due: 'Today', repeat: 'Daily' })

  const rows = async (title: string) =>
    (await admin().from('tasks').select('*').eq('title', title)).data!
  await expect.poll(async () => (await rows('Remote task')).length).toBe(1)
  expect((await rows('Remote task'))[0].priority).toBe(10)

  await page.getByText('Remote task', { exact: true }).dblclick()
  await expect.poll(async () => (await rows('Remote task')).length).toBe(0)

  const [standup] = await rows('Daily standup')
  await page.getByText('Daily standup', { exact: true }).dblclick()
  await expect
    .poll(async () => (await rows('Daily standup'))[0].deadline)
    .not.toBe(standup.deadline)
  const [moved] = await rows('Daily standup')
  expect(await daysFromToday(page, moved.deadline)).toBe(1)
  expect(errors).toEqual([])
})

test('a failed save shows an accessible alert and rolls back', async ({
  page,
}) => {
  await page.goto('/')
  await addTask(page, 'Keep me')
  await page.route('**/rest/v1/tasks**', (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({ status: 500, body: '{"message":"forced failure"}' })
      : route.continue()
  )
  await page.getByText('Keep me', { exact: true }).click()
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Task title').fill('Should not stick')
  await page.getByRole('button', { name: 'Save' }).click()

  // Must be announced even while the task dialog is open.
  await expect(page.getByRole('alert')).toContainText("Couldn't save")
  await expect(page.getByText('Keep me', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Should not stick')).toHaveCount(0)
})

test('offers to import guest tasks after signing in', async ({ page }) => {
  // Guest data from before signing in, as an older version might have saved it.
  await page.goto('/')
  await page.evaluate(() => {
    const id = crypto.randomUUID()
    const gym = crypto.randomUUID()
    const task = (title: string, categoryId: string) => ({
      id: crypto.randomUUID(),
      title,
      createdAt: new Date().toISOString(),
      pos_x: 30,
      pos_y: 40,
      categoryId,
      workspaceId: id,
      recurrence: 'never',
      priority: 0,
    })
    localStorage.setItem(
      'c-loom-boards',
      JSON.stringify([
        {
          id,
          name: 'My Workspace',
          createdAt: new Date().toISOString(),
          userId: 'local',
          tasks: [task('Guest task', '1'), task('Leg day', gym)],
        },
      ])
    )
    localStorage.setItem(
      'c-loom-categories',
      JSON.stringify([
        { id: '1', name: 'Work', color: '#3b82f6', workspaceId: 'default' },
        { id: gym, name: 'Gym', color: '#FF9500', workspaceId: id },
      ])
    )
  })
  await page.reload()

  const banner = page.getByRole('region', { name: 'Import guest tasks' })
  await expect(banner).toContainText('2 tasks')
  await banner.getByRole('button', { name: 'Import' }).click()
  await expect(banner).toHaveCount(0)
  await expect(page.getByText('Leg day', { exact: true })).toBeVisible()

  const { data: workspaces } = await admin()
    .from('workspaces')
    .select('id')
    .eq('user_id', userId)
  expect(workspaces).toHaveLength(1) // merged, not duplicated
  expect(
    await page.evaluate(() => localStorage.getItem('c-loom-boards'))
  ).toBeNull()

  await page.reload()
  await expect(page.getByText('Leg day', { exact: true })).toBeVisible()
  await expect(banner).toHaveCount(0)
})

test('saves circle positions once overlapping circles settle', async ({
  page,
}) => {
  // Two tasks stacked on the same spot force the layout to move them.
  const ws = await workspaceId()
  const stacked = ['Stacked A', 'Stacked B'].map((title) => ({
    id: crypto.randomUUID(),
    workspace_id: ws,
    title,
    pos_x: 50,
    pos_y: 50,
  }))
  await admin().from('tasks').insert(stacked)

  await page.goto('/')
  await expect(page.getByText('Stacked B', { exact: true })).toBeVisible()

  const saved = async () =>
    (
      await admin()
        .from('tasks')
        .select('pos_x, pos_y')
        .in(
          'id',
          stacked.map((t) => t.id)
        )
    ).data!
  await expect
    .poll(async () => (await saved()).some((t) => t.pos_x !== 50), {
      timeout: 10_000,
    })
    .toBe(true)

  // After a reload the circles start where they were left.
  const positions = await saved()
  await page.reload()
  await expect(page.getByText('Stacked B', { exact: true })).toBeVisible()
  const onScreen = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '[style*="translate(-50%, -50%)"]'
      ),
    ]
      .map((el) => parseFloat(el.style.left))
      .sort((x, y) => x - y)
  )
  expect(onScreen).toEqual(positions.map((p) => p.pos_x).sort((x, y) => x - y))
})
