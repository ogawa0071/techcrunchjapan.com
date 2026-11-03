import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    // Neon: use the direct (non-pooled) connection string for migrations.
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
})
