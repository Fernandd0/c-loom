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

const SAMPLE_TITLES = [
  'Biggest one goes first',
  'Click me to see what I am',
  'Double-click me when done',
  'Add your own: press N',
]

// Most tests start from an empty galaxy, so the example tasks are cleared first.
test.beforeEach(async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByText('Create your first galaxy').click()
  await expect(page.getByRole('button', { name: 'New task' })).toBeVisible()
  if (testInfo.title.startsWith('a new guest')) return
  await expect(page.getByText(SAMPLE_TITLES[0])).toBeVisible()
  await page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('c-loom-boards') || '[]')
    for (const b of boards) b.tasks = []
    localStorage.setItem('c-loom-boards', JSON.stringify(boards))
  })
  await page.reload()
  await expect(page.getByText('All clear on My Galaxy.')).toBeVisible()
})

test('a new guest starts with example tasks they can open and complete', async ({
  page,
}) => {
  for (const title of SAMPLE_TITLES) {
    await expect(page.getByText(title, { exact: true })).toBeVisible()
  }
  // They're real tasks: saved, and the biggest one is due today.
  expect((await storedTasks(page)).map((t) => t.title).sort()).toEqual(
    [...SAMPLE_TITLES].sort()
  )
  const first = await stored(page, SAMPLE_TITLES[0])
  expect(await daysFromToday(page, first!.deadline!)).toBe(0)

  await page.getByText('Click me to see what I am', { exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Every circle is a task')
  await page.keyboard.press('Escape')

  await page.getByText('Double-click me when done', { exact: true }).dblclick()
  await expect(
    page.getByText('Double-click me when done', { exact: true })
  ).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByText('Double-click me when done', { exact: true })
  ).toHaveCount(0)
  await expect(page.getByText(SAMPLE_TITLES[0], { exact: true })).toBeVisible()
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

  // Re-picking the same day rewrites the deadline from the inputs each time.
  await page.getByText('Write report', { exact: true }).click()
  const due = page.getByRole('button', { name: 'Due: Tomorrow, 6:30 PM' })
  await due.click()
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Tomorrow', exact: true }).click()
  }
  await page.keyboard.press('Escape')
  await expect(due).toBeVisible()
  expect((await stored(page, 'Write report'))!.deadline).toBe(task.deadline)
})

test('only offers Repeat once a due date is set', async ({ page }) => {
  await page.getByRole('button', { name: 'New task' }).click()
  await page.getByRole('button', { name: /^Due:/ }).click()
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

test('edits a task in place from its detail view', async ({ page }) => {
  await addTask(page, 'Draft', { due: 'Today', repeat: 'Weekly' })
  await page.getByText('Draft', { exact: true }).click()
  const dialog = page.getByRole('dialog')

  await dialog.getByRole('button', { name: 'Draft' }).click()
  await dialog.getByLabel('Task title').fill('Final')
  await dialog.getByLabel('Task title').press('Enter')
  await expect(dialog.getByRole('button', { name: 'Final' })).toBeVisible()

  await dialog.getByRole('button', { name: 'Priority: Low' }).click()
  await page.getByRole('radio', { name: 'Critical' }).click()
  await expect(dialog.getByText(/^Every \w+day$/)).toBeVisible()

  await expect
    .poll(async () => (await stored(page, 'Final'))?.priority)
    .toBe(10)
  expect(await stored(page, 'Draft')).toBeUndefined()

  // Clearing the date also stops the repeat.
  await dialog.getByRole('button', { name: /^Due:/ }).click()
  await page.getByRole('button', { name: 'No date', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(dialog.getByText(/^Every /)).toHaveCount(0)
  const final = (await stored(page, 'Final'))! as StoredTask & {
    recurrence: string
  }
  expect(final.deadline).toBeUndefined()
  expect(final.recurrence).toBe('never')
})

test('Escape cancels a title edit without closing the task', async ({
  page,
}) => {
  await addTask(page, 'Keep this title')
  await page.getByText('Keep this title', { exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Keep this title' }).click()
  await dialog.getByLabel('Task title').fill('Discarded')
  await page.keyboard.press('Escape')
  await expect(
    dialog.getByRole('button', { name: 'Keep this title' })
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(await stored(page, 'Discarded')).toBeUndefined()
})

test('focusing a category dims the rest and new tasks start in it', async ({
  page,
}) => {
  await addTask(page, 'Work task')
  await addTask(page, 'Home task', { newCategory: 'Home' })
  const bar = page.getByRole('radiogroup', { name: 'Show category' })
  await bar.getByRole('radio', { name: /^Home/ }).click()

  const wrapper = (title: string) =>
    page
      .getByText(title, { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"absolute")][1]')
  await expect(wrapper('Work task')).toHaveClass(/opacity-20/)
  await expect(wrapper('Home task')).not.toHaveClass(/opacity-20/)

  await page.getByRole('button', { name: 'New task' }).click()
  await expect(
    page.getByRole('button', { name: 'Category: Home' })
  ).toBeVisible()
  await page.keyboard.press('Escape')

  await bar.getByRole('radio', { name: 'All' }).click()
  await expect(wrapper('Work task')).not.toHaveClass(/opacity-20/)
})

test('renames, recolors and deletes categories', async ({ page }) => {
  await addTask(page, 'Ship it')
  await page.getByRole('button', { name: 'Edit categories' }).click()
  const dialog = page.getByRole('dialog')

  const name = dialog.getByLabel('Name of Work')
  await name.fill('Job')
  await name.press('Enter')
  await expect(dialog.getByLabel('Name of Job')).toBeVisible()

  await dialog.getByRole('button', { name: 'Color and icon for Job' }).click()
  await page.getByRole('button', { name: 'Plum' }).click()
  await page.keyboard.press('Escape')

  const categories = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('c-loom-categories') || '[]') as {
          id: string
          name: string
          color: string
        }[]
    )
  await expect
    .poll(async () => (await categories()).find((c) => c.name === 'Job')?.color)
    .toBe('#8E6C8A')

  await dialog.getByRole('button', { name: 'Delete Job' }).click()
  await expect(dialog).toContainText('1 task stays, without a category.')
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(dialog.getByLabel('Name of Job')).toHaveCount(0)
  expect((await categories()).some((c) => c.name === 'Job')).toBe(false)

  // The task survives without a category.
  await page.keyboard.press('Escape')
  await expect(page.getByText('Ship it', { exact: true })).toBeVisible()
  expect((await stored(page, 'Ship it')) as unknown).toMatchObject({
    categoryId: '',
  })
})

test('reads due date, priority, repeat and category from the title', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'New task' }).click()
  const title = page.getByLabel('Task title')
  await title.fill('Pay rent tomorrow 9am #personal !high every month')
  await expect(
    page.getByRole('button', { name: 'Category: Personal' })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Due: Tomorrow, 9:00 AM' })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Priority: High' })
  ).toBeVisible()

  // A pick by hand beats the title.
  await page.getByRole('button', { name: 'Priority: High' }).click()
  await page.getByRole('radio', { name: 'Critical' }).click()
  await title.press('Enter')

  await expect(page.getByText('Pay rent', { exact: true })).toBeVisible()
  const task = (await stored(page, 'Pay rent'))! as StoredTask & {
    recurrence: string
    categoryId: string
  }
  expect(task.priority).toBe(10)
  expect(task.recurrence).toBe('monthly')
  expect(await daysFromToday(page, task.deadline!)).toBe(1)
  const categories = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('c-loom-categories') || '[]')
  )
  expect(
    categories.find((c: { id: string }) => c.id === task.categoryId).name
  ).toBe('Personal')
})

test('"Keep as text" turns title reading off', async ({ page }) => {
  await page.getByRole('button', { name: 'New task' }).click()
  await page.getByLabel('Task title').fill('Review notes tomorrow')
  await expect(
    page.getByRole('button', { name: 'Due: Tomorrow' })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Keep as text' }).click()
  await expect(page.getByRole('button', { name: 'Due: no date' })).toBeVisible()
  await page.getByLabel('Task title').press('Enter')
  const task = (await stored(page, 'Review notes tomorrow'))!
  expect(task.deadline).toBeUndefined()
})

test('N opens the new task dialog, but not while typing', async ({ page }) => {
  await page.keyboard.press('n')
  const title = page.getByLabel('Task title')
  await expect(title).toBeFocused()
  await title.fill('Not again')
  await title.press('n')
  await expect(title).toHaveValue('Not againn')
  await expect(page.getByRole('dialog')).toHaveCount(1)
})

test('a signed-out visitor with old local data starts on the landing', async ({
  page,
}) => {
  await addTask(page, 'Left from before')
  // As if the visitor never chose to use this device (older version, or after signing out).
  await page.evaluate(() => localStorage.removeItem('c-loom-guest-mode'))
  await page.reload()

  const resume = page.getByRole('button', { name: /Continue on this device/ })
  await expect(resume).toContainText('1 task')
  await expect(page.getByText('Left from before', { exact: true })).toHaveCount(
    0
  )
  await resume.click()
  await expect(
    page.getByText('Left from before', { exact: true })
  ).toBeVisible()

  // The choice is remembered.
  await page.reload()
  await expect(
    page.getByText('Left from before', { exact: true })
  ).toBeVisible()
})

test('first-run hints: a click hides them, the setting turns them off', async ({
  page,
}) => {
  const hints = page.getByTestId('onboarding-hints')
  await expect(hints).toBeVisible()
  await expect(hints).toContainText('or just press N')

  // A click hides them for this visit; they're back next time.
  await page.mouse.click(600, 400)
  await expect(hints).toHaveCount(0)
  await page.reload()
  await expect(hints).toBeVisible()

  // On by default in Settings; switching it off keeps them away.
  await page.keyboard.press('Meta+,')
  const toggle = page.getByRole('switch', { name: 'First-run hints' })
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await page.reload()
  await expect(page.getByRole('button', { name: 'New task' })).toBeVisible()
  await expect(hints).toHaveCount(0)
})

// Regression: the dialogs lived inside the sidebar, so the shortcuts did nothing while it was closed.
test('? and ⌘G work with the sidebar closed', async ({ page }) => {
  await page.keyboard.press('?')
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('heading', { name: 'Keyboard Shortcuts' })
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await page.keyboard.press('Meta+g')
  await expect(
    dialog.getByRole('heading', { name: 'How C-LOOM works' })
  ).toBeVisible()
})

test('Settings switches between Light, Dark, Galaxy and Automatic', async ({
  page,
}) => {
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'light')

  await page.keyboard.press('Meta+,')
  const appearance = page.getByRole('radiogroup', { name: 'Appearance' })
  await appearance.getByRole('radio', { name: 'Galaxy' }).click()
  await expect(html).toHaveAttribute('data-theme', 'galaxy')

  // Applied before the first paint on the next load, not after hydration.
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'galaxy')

  await page.keyboard.press('Meta+,')
  await appearance.getByRole('radio', { name: 'Dark' }).click()
  await expect(html).toHaveAttribute('data-theme', 'dark')

  // Automatic follows the device, which is light in these tests.
  await appearance.getByRole('radio', { name: 'Automatic' }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')
})

// Regression: with every category deleted, "Create task" stayed disabled with no reason given.
test('a task can be created without any category', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit categories' }).click()
  for (const name of ['Work', 'Personal']) {
    await page.getByRole('button', { name: `Delete ${name}` }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
  }
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'New task' }).click()
  await expect(
    page.getByRole('button', { name: 'Category: none' })
  ).toBeVisible()
  await page.getByLabel('Task title').fill('Buy milk')
  await page.getByLabel('Task title').press('Enter')
  await expect(page.getByText('Buy milk', { exact: true })).toBeVisible()
  expect((await stored(page, 'Buy milk')) as unknown).toMatchObject({
    categoryId: '',
  })
})

test('the sidebar is a drawer that shows each galaxy’s load', async ({
  page,
}) => {
  const errors = trackConsoleErrors(page)
  await addTask(page, 'Pay rent', { due: 'Today' })
  await addTask(page, 'Someday')

  await page.keyboard.press('Meta+b')
  const drawer = page.getByRole('dialog', { name: 'Galaxies' })
  await expect(drawer).toBeVisible()
  await expect(
    drawer.getByRole('button', { name: /^My Galaxy\s*2\s*, 1 due today$/ })
  ).toHaveAttribute('aria-current', 'page')

  await page.keyboard.press('Escape')
  await expect(drawer).toHaveCount(0)
  expect(errors).toEqual([])
})

test('a new galaxy is named right away and 1–9 switch between them', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Open sidebar' }).click()
  await page.getByRole('button', { name: 'New Galaxy' }).click()
  const name = page.getByLabel('Galaxy name')
  await expect(name).toBeFocused()
  await name.fill('Side projects')
  await name.press('Enter')
  await expect(page.getByText('All clear on Side projects.')).toBeVisible()

  await page.keyboard.press('Escape')
  await page.keyboard.press('1')
  await expect(page.getByText('All clear on My Galaxy.')).toBeVisible()
  await page.keyboard.press('2')
  await expect(page.getByText('All clear on Side projects.')).toBeVisible()
})

test('a galaxy is renamed and deleted from its menu', async ({ page }) => {
  await addTask(page, 'Lonely task')
  await page.getByRole('button', { name: 'Open sidebar' }).click()
  await page.getByRole('button', { name: 'New Galaxy' }).click()
  await page.getByLabel('Galaxy name').press('Enter')

  await page.getByRole('button', { name: 'My Galaxy options' }).click()
  await page.getByRole('button', { name: 'Rename' }).click()
  // Escape cancels the rename and leaves the drawer open.
  await page.getByLabel('Galaxy name').fill('Nope')
  await page.getByLabel('Galaxy name').press('Escape')
  await expect(page.getByRole('button', { name: 'My Galaxy 1' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Galaxies' })).toBeVisible()

  await page.getByRole('button', { name: 'My Galaxy options' }).click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(
    page.getByRole('heading', { name: 'Delete “My Galaxy”?' })
  ).toBeVisible()
  await expect(page.getByText('Its 1 task goes with it.')).toBeVisible()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByRole('button', { name: /^My Galaxy/ })).toHaveCount(0)
})

test('a pinned sidebar stays open after a reload', async ({ page }) => {
  await page.keyboard.press('Meta+b')
  await page.getByRole('button', { name: 'Keep sidebar open' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open sidebar' })).toHaveCount(
    0
  )

  await page.reload()
  await expect(page.getByRole('navigation', { name: 'Galaxies' })).toBeVisible()
  await page.keyboard.press('Meta+b')
  await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Galaxies' })).toHaveCount(
    0
  )
})

test('on a phone, picking a galaxy closes the drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Open sidebar' }).click()
  await expect(
    page.getByRole('button', { name: 'Keep sidebar open' })
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'New Galaxy' }).click()
  await page.getByLabel('Galaxy name').press('Enter')
  await page.getByRole('button', { name: 'My Galaxy', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText('All clear on My Galaxy.')).toBeVisible()
})

test('⌘K jumps to a galaxy or runs an action', async ({ page }) => {
  const errors = trackConsoleErrors(page)
  await page.keyboard.press('Meta+k')
  const search = page.getByRole('combobox', {
    name: 'Search galaxies and actions',
  })
  await expect(search).toBeFocused()

  // New galaxy opens the drawer with its name field ready.
  await search.fill('new gal')
  await search.press('Enter')
  const name = page.getByLabel('Galaxy name')
  await expect(name).toBeFocused()
  await name.fill('Side projects')
  await name.press('Enter')
  await page.keyboard.press('Escape')

  await page.keyboard.press('Meta+k')
  await search.fill('my')
  await expect(
    page.getByRole('option', { name: /My Galaxy/, selected: true })
  ).toBeVisible()
  await search.press('Enter')
  await expect(page.getByText('All clear on My Galaxy.')).toBeVisible()

  await page.keyboard.press('Meta+k')
  await search.fill('task')
  await search.press('Enter')
  await expect(page.getByLabel('Task title')).toBeFocused()
  // "?" is just text while typing a title.
  await page.keyboard.type('Why?')
  await expect(
    page.getByRole('heading', { name: 'Keyboard Shortcuts' })
  ).toHaveCount(0)
  expect(errors).toEqual([])
})

test('the sidebar offers sign-in and opens settings', async ({ page }) => {
  await page.getByRole('button', { name: 'Open sidebar' }).click()
  await expect(
    page.getByRole('button', { name: 'Sign in to sync' })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(
    page.getByRole('radiogroup', { name: 'Appearance' })
  ).toBeVisible()
})
