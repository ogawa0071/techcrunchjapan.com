import { defineConfig } from 'vitest/config'

// Unit tests of pure modules (src/, scripts/) and integration tests of the query layer
// against a local D1 database (test/, through wrangler's getPlatformProxy). Neither needs
// the Cloudflare / TanStack Vite plugins.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'test/**/*.test.ts'],
  },
})
