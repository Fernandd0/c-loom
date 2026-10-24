import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    // A zone with a negative UTC offset, where the old deadline bug showed up.
    env: { TZ: 'America/Bogota' },
    // Integration tests talk to a real Supabase project.
    testTimeout: 30_000,
  },
})
