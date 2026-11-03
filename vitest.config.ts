import { defineConfig } from 'vitest/config'

// Unit tests for pure modules only; they do not need the Cloudflare / TanStack plugins.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
