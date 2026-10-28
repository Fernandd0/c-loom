import { Page } from '@playwright/test'
import {
  addTask,
  admin,
  expect,
  hasSupabase,
  signInNewUser,
  test,
} from './helpers'

// Two real accounts in two browser contexts; needs SUPABASE_SERVICE_ROLE_KEY.
test.skip(!hasSupabase, 'Supabase credentials not available')

const galaxyMenu = async (page: Page, name: string) => {
  await page.getByRole('button', { name: 'Open sidebar' }).click()
  await page.getByRole('button', { name: `${name} options` }).click()
}

test('a galaxy is shared by link and stays in sync live', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(90_000)
  const ownerContext = await browser.newContext()
  const friendContext = await browser.newContext()
  await ownerContext.grantPermissions(['clipboard-read', 'clipboard-write'])
  const owner = await signInNewUser(ownerContext, baseURL!, 'Olivia Owner')
  const friend = await signInNewUser(friendContext, baseURL!, 'Bea Friend')

  try {
    // A distinct name, since both accounts start with "My Galaxy".
    await admin()
      .from('workspaces')
      .update({ name: 'Family' })
      .eq('user_id', owner.userId)

    const a = await ownerContext.newPage()
    await a.goto('/')
    await expect(a.getByText('All clear on Family.')).toBeVisible()
    await addTask(a, 'Buy paint')

    // Owner creates the link.
    await galaxyMenu(a, 'Family')
    // Only the owner can delete.
    await expect(
      a.getByRole('button', { name: 'Delete', exact: true })
    ).toBeVisible()
    await a.getByRole('button', { name: 'Share…' }).click()
    const dialog = a.getByRole('dialog', { name: 'Share “Family”' })
    await dialog
      .getByRole('button', { name: 'Create and copy invite link' })
      .click()
    const link = await dialog
      .getByRole('textbox', { name: 'Invite link' })
      .inputValue()
    expect(link).toMatch(/\/join\/[0-9a-f]{64}$/)
    await a.keyboard.press('Escape')
    await a.keyboard.press('Escape')

    // Friend opens it and lands in the shared galaxy.
    const b = await friendContext.newPage()
    await b.goto(link)
    await expect(b.getByText('Buy paint', { exact: true })).toBeVisible()

    // Changes show up on the other screen without reloading.
    await addTask(a, 'Fix the door')
    await expect(b.getByText('Fix the door', { exact: true })).toBeVisible({
      timeout: 15_000,
    })

    // Each sees who else is here.
    await expect(
      a.getByRole('status', { name: 'Bea Friend is here' })
    ).toBeVisible({
      timeout: 15_000,
    })

    // Friend completes a task: it disappears for the owner, who is told who did it.
    await b.getByText('Fix the door', { exact: true }).dblclick()
    await expect(a.getByText('Fix the door', { exact: true })).toHaveCount(0, {
      timeout: 15_000,
    })
    await expect(
      a.getByText('Bea Friend completed “Fix the door”')
    ).toBeVisible()

    // The history keeps it.
    await galaxyMenu(a, 'Family')
    await a.getByRole('button', { name: 'Completed', exact: true }).click()
    const history = a.getByRole('dialog', { name: 'Completed' })
    await expect(history.getByText('Fix the door')).toBeVisible()
    await expect(history.getByText(/Bea Friend ·/)).toBeVisible()
    await a.keyboard.press('Escape')

    // The friend can't delete, only leave.
    await galaxyMenu(b, 'Family')
    await expect(
      b.getByRole('button', { name: 'Delete', exact: true })
    ).toHaveCount(0)
    await b.getByRole('button', { name: 'Leave', exact: true }).click()
    await b.getByRole('button', { name: 'Leave galaxy' }).click()
    await b.getByRole('button', { name: 'Leave', exact: true }).click()
    await expect(b.getByRole('button', { name: 'Family options' })).toHaveCount(
      0
    )
  } finally {
    await ownerContext.close()
    await friendContext.close()
    await owner.cleanup()
    await friend.cleanup()
  }
})

test('an invite opened while signed out asks to sign in; a bad one says so', async ({
  page,
}) => {
  await page.goto(`/join/${'0'.repeat(64)}`)
  await expect(
    page.getByRole('heading', { name: "You're invited to a galaxy" })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Sign in with Google to join' })
  ).toBeVisible()
})

test('a link that was turned off explains itself', async ({
  context,
  page,
  baseURL,
}) => {
  const user = await signInNewUser(context, baseURL!)
  try {
    await page.goto(`/join/${'0'.repeat(64)}`)
    await expect(
      page.getByRole('heading', { name: "This invite doesn't work" })
    ).toBeVisible()
  } finally {
    await user.cleanup()
  }
})
