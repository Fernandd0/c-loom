import { Page } from '@playwright/test'
import {
  addTask,
  daysFromToday,
  expect,
  test,
  trackConsoleErrors,
} from './helpers'

type StoredTask = {
  title: string
  deadline?: string
  priority?: number
  createdAt: string
}

const storedTasks = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('c-loom-boards') || '[]').flatMap(
        (b: { tasks: unknown[] }) => b.tasks
      ) as StoredTask[]
  )
const stored = async (page: Page, title: string) =>
  (await storedTasks(page)).find((t) => t.title === title)

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByText('Create Workspace').click()
  await expect(page.getByRole('button', { name: 'New task' })).toBeVisible()
})

test('creates a task with only a title, using the preselected category', async ({
  page,
}) => {
  const errors = trackConsoleErrors(page)
  await page.getByRole('button', { name: 'New task' }).click()
  await page.getByLabel('Task title').fill('Quick one')
  await expect(page.getByRole('button', { name: 'Create task' })).toBeEnabled()
  await page.getByLabel('Task title').press('Enter')
  await expect(page.getByText('Quick one', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('saves deadlines in local time and they never drift on edit', async ({
  page,
}) => {
  await addTask(page, 'Write report', {
    due: 'Tomorrow',
    time: '18:30',
    priority: 'High',
  })
  const task = (await stored(page, 'Write report'))!
  expect(await daysFromToday(page, task.deadline!)).toBe(1)
  expect(
    await page.evaluate(
      (iso) => new Date(iso).toTimeString().slice(0, 5),
      task.deadline!
    )
  ).toBe('18:30')
  expect(task.priority).toBe(7)

  await page.getByText('Write report', { exact: true }).click()
  await expect(page.getByText('Tomorrow, 6:30 PM')).toBeVisible()
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
  }
  expect((await stored(page, 'Write report'))!.deadline).toBe(task.deadline)
})

test('only offers Repeat once a due date is set', async ({ page }) => {
  await page.getByRole('button', { name: 'New task' }).click()
  const repeat = page.getByRole('radiogroup', { name: 'Repeat' })
  await expect(repeat).toHaveCount(0)
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await expect(repeat).toBeVisible()
})

test('keeps tasks created back to back, and across reloads', async ({
  page,
}) => {
  await addTask(page, 'First')
  await addTask(page, 'Second')
  await addTask(page, 'Third')
  await page.reload()
  await expect(page.getByText('Third', { exact: true })).toBeVisible()
  expect((await storedTasks(page)).map((t) => t.title).sort()).toEqual([
    'First',
    'Second',
    'Third',
  ])
})

test('double click deletes a one-off task and advances a recurring one', async ({
  page,
}) => {
  await addTask(page, 'One-off')
  await addTask(page, 'Daily standup', { due: 'Today', repeat: 'Daily' })
  const before = (await stored(page, 'Daily standup'))!

  await page.getByText('One-off', { exact: true }).dblclick()
  await expect(page.getByText('One-off', { exact: true })).toHaveCount(0)

  await page.getByText('Daily standup', { exact: true }).dblclick()
  await expect
    .poll(async () => (await stored(page, 'Daily standup'))?.deadline)
    .not.toBe(before.deadline)
  const after = (await stored(page, 'Daily standup'))!
  expect(await daysFromToday(page, after.deadline!)).toBe(1)
  expect(after.createdAt > before.createdAt).toBe(true)
})

test('a category created from the form is selected and used', async ({
  page,
}) => {
  await addTask(page, 'Leg day', { newCategory: 'Gym' })
  const categories = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('c-loom-categories') || '[]')
  )
  const gym = categories.find((c: { name: string }) => c.name === 'Gym')
  const task = await page.evaluate(
    () => JSON.parse(localStorage.getItem('c-loom-boards') || '[]')[0].tasks[0]
  )
  expect(task.categoryId).toBe(gym.id)
})
