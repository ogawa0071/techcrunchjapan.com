import { DrizzleQueryError } from 'drizzle-orm'

/** Some driver messages quote a bound value (e.g. a whole article); keep them short. */
const MAX_LENGTH = 500

/**
 * The underlying driver message (with code and detail). Drizzle's own error message
 * contains the whole statement, so it is never printed.
 */
export function describeError(error: unknown): string {
  const message = driverMessage(error)
  return message.length > MAX_LENGTH
    ? `${message.slice(0, MAX_LENGTH)}… (${message.length} characters)`
    : message
}

function driverMessage(error: unknown): string {
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
