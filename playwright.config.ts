import { defineConfig } from '@playwright/test'

try {
  process.loadEnvFile('.env')
} catch {
  // No .env file: rely on the environment (CI).
}

const PORT = 3123
const isCI = !!process.env.CI

export default defineConfig({
  testDir: 'e2e',
  // Tests share one server and, when signed in, one Supabase project.
  workers: 1,
  retries: isCI ? 1 : 0,
  reporter: isCI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // A zone with a negative UTC offset, where the old deadline bug showed up.
    timezoneId: 'America/Bogota',
    viewport: { width: 1280, height: 860 },
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    channel: isCI ? undefined : 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    // CI builds in an earlier step; locally build first so tests run the current code.
    command: isCI
      ? `pnpm start --port ${PORT}`
      : `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
})
