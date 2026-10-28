import { BrowserContext, expect, Page, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Signed-in tests need a real project and the service role key to create throwaway users.
export const hasSupabase = !!(
  url &&
  anonKey &&
  serviceKey &&
  !url.includes('placeholder')
)

export const admin = () =>
  createClient(url!, serviceKey!, { auth: { persistSession: false } })

// Same cookie format @supabase/ssr writes: "base64-" + base64url(session JSON), in chunks.
function sessionCookies(session: object) {
  const ref = new URL(url!).hostname.split('.')[0]
  const name = `sb-${ref}-auth-token`
  const value =
    'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url')
  const size = 3180
  if (value.length <= size) return [{ name, value }]
  const chunks = []
  for (let i = 0; i * size < value.length; i++) {
    chunks.push({
      name: `${name}.${i}`,
      value: value.slice(i * size, (i + 1) * size),
    })
  }
  return chunks
}

// Creates a confirmed user and signs the browser context in as them. Call cleanup() after.
export async function signInNewUser(
  context: BrowserContext,
  baseURL: string,
  // Shown to other members of a shared galaxy.
  fullName?: string
) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
  const password = `T3st-${crypto.randomUUID()}`
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  })
  if (error) throw error

  const client = createClient(url!, anonKey!, {
    auth: { persistSession: false },
  })
  const signIn = await client.auth.signInWithPassword({ email, password })
  if (signIn.error) throw signIn.error
  await context.addCookies(
    sessionCookies(signIn.data.session).map((c) => ({ ...c, url: baseURL }))
  )

  return {
    userId: data.user.id,
    cleanup: () => admin().auth.admin.deleteUser(data.user.id),
  }
}

export async function addTask(
  page: Page,
  title: string,
  options: {
    due?: 'Today' | 'Tomorrow' | 'Next week'
    time?: string
    repeat?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
    priority?: 'Low' | 'Medium' | 'High' | 'Critical'
    newCategory?: string
  } = {}
) {
  await page.getByRole('button', { name: 'New task' }).click()
  await page.getByLabel('Task title').fill(title)
  if (options.newCategory) {
    await page.getByRole('button', { name: /^Category:/ }).click()
    await page.getByRole('button', { name: 'New', exact: true }).click()
    await page.getByPlaceholder('Category name').fill(options.newCategory)
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(
      page.getByRole('button', { name: `Category: ${options.newCategory}` })
    ).toBeVisible()
  }
  if (options.due) {
    await page.getByRole('button', { name: /^Due:/ }).click()
    await page.getByRole('button', { name: options.due, exact: true }).click()
    if (options.time) {
      await page.getByLabel('Other time').selectOption(options.time)
    }
    if (options.repeat) {
      await page
        .getByRole('radiogroup', { name: 'Repeat' })
        .getByRole('radio', { name: options.repeat })
        .click()
    }
    // Closes only the date picker, not the dialog.
    await page.keyboard.press('Escape')
    await expect(page.getByRole('radiogroup', { name: 'Repeat' })).toHaveCount(
      0
    )
  }
  if (options.priority) {
    await page.getByRole('button', { name: /^Priority:/ }).click()
    await page
      .getByRole('radiogroup', { name: 'Priority' })
      .getByRole('radio', { name: options.priority })
      .click()
    await expect(
      page.getByRole('button', { name: `Priority: ${options.priority}` })
    ).toBeVisible()
  }
  await page.getByLabel('Task title').press('Enter')
  await expect(page.getByText(title, { exact: true })).toBeVisible()
}

// Whole local calendar days between today and an ISO date, evaluated in the browser's zone.
export const daysFromToday = (page: Page, iso: string) =>
  page.evaluate((value) => {
    const d = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    return Math.round((day.getTime() - today.getTime()) / 864e5)
  }, iso)

// Fails the test on unexpected console errors. Vercel Analytics only exists when deployed.
export function trackConsoleErrors(page: Page, allow: RegExp[] = []) {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    if (m.location().url.includes('/_vercel/')) return
    if (allow.some((r) => r.test(m.text()))) return
    errors.push(m.text())
  })
  return errors
}

// What browser translation (Chrome, Edge) does to the page: every text node is moved
// inside <font><font>…</font></font>, behind React's back.
export const translatePage = (page: Page) =>
  page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    )
    const nodes: Text[] = []
    while (walker.nextNode()) nodes.push(walker.currentNode as Text)
    for (const node of nodes) {
      if (!node.textContent?.trim()) continue
      const outer = document.createElement('font')
      const inner = document.createElement('font')
      inner.textContent = node.textContent
      outer.appendChild(inner)
      node.replaceWith(outer)
    }
  })

export { test, expect }
