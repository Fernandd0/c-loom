import { expect, test } from '@playwright/test'

// Google OAuth brand verification needs these reachable from the home page.
test('the landing links to the privacy policy and terms', async ({ page }) => {
  await page.goto('/')
  const legal = page.getByRole('navigation', { name: 'Legal' })

  await legal.getByRole('link', { name: 'Privacy' }).click()
  await expect(page).toHaveURL(/\/privacy$/)
  await expect(
    page.getByRole('heading', { name: 'Privacy Policy', level: 1 })
  ).toBeVisible()
  await expect(page).toHaveTitle('Privacy Policy · c-loom')

  await page
    .getByRole('navigation', { name: 'Legal' })
    .getByRole('link', { name: 'Terms' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Terms of Service', level: 1 })
  ).toBeVisible()

  await page.getByRole('link', { name: 'c-loom' }).click()
  await expect(
    page.getByRole('button', { name: 'Create your first galaxy' })
  ).toBeVisible()
})

test('the landing explains itself with hand-drawn notes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  // Says what the app is before any metaphor.
  await expect(
    page.getByText('A to-do list that shows what matters.')
  ).toBeVisible()
  for (const note of ['is a task', 'no account needed', 'on every device']) {
    await expect(page.getByText(note).last()).toBeVisible()
  }
  // They never get in the way of the buttons.
  await page.getByRole('button', { name: 'Create your first galaxy' }).click()
  await expect(page.getByRole('button', { name: 'New task' })).toBeVisible()
})
