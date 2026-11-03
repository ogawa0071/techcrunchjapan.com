import { DrizzleQueryError } from 'drizzle-orm'

/**
 * The underlying driver message (with code and detail). Drizzle's own error message
 * contains the whole statement and its parameters (e.g. article HTML), so it is never
 * printed.
 */
export function describeError(error: unknown): string {
  let current = error
  while (
    current instanceof DrizzleQueryError &&
    current.cause instanceof Error
  ) {
    current = current.cause
  }
  if (!(current instanceof Error)) return String(current)
  const details = current as Error & { code?: unknown; detail?: unknown }
  const code = typeof details.code === 'string' ? `(code ${details.code})` : ''
  const detail = typeof details.detail === 'string' ? details.detail : ''
  return [current.message, code, detail].filter(Boolean).join(' ')
}
