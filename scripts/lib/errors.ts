import { inspect } from 'node:util'

import { DrizzleQueryError } from 'drizzle-orm'

/** Some driver messages quote a bound value (e.g. a whole article); keep them short. */
const MAX_LENGTH = 500

/** What wrangler (location, notes) and database drivers (code, detail) attach to errors. */
interface ErrorDetails {
  code?: unknown
  detail?: unknown
  location?: {
    file?: unknown
    line?: unknown
    column?: unknown
    lineText?: unknown
  }
  notes?: { text?: unknown }[]
  cause?: unknown
}

/**
 * A failure, for the console: the messages along the cause chain with the details that
 * wrangler and the drivers attach, and where in our code it happened. Drizzle's own
 * message is left out (it contains the whole statement); long messages are shortened.
 */
export function describeError(error: unknown): string {
  const lines: string[] = []
  let previous = ''
  let current = error
  for (let depth = 0; current !== undefined && current !== null; depth++) {
    if (depth === 10) break
    const details = (typeof current === 'object' ? current : {}) as ErrorDetails
    if (current instanceof DrizzleQueryError) {
      // Skipped: the driver's error is its cause.
    } else if (current instanceof Error) {
      const message = shorten(current.message)
      // Wrappers often repeat the message of their cause.
      if (!message || !previous.includes(message)) {
        lines.push(
          `${lines.length > 0 ? 'Caused by: ' : ''}${current.name}${message ? `: ${message}` : ''}`,
        )
      }
      if (message) previous = message
      lines.push(...detailLines(details))
      // E.g. a refused connection to every address of a host (with an empty message).
      if (current instanceof AggregateError) {
        for (const inner of current.errors) {
          lines.push(
            `  - ${inner instanceof Error ? shorten(inner.message) : inspect(inner)}`,
          )
        }
      }
    } else if (!('cause' in details)) {
      lines.push(
        shorten(typeof current === 'string' ? current : inspect(current)),
      )
    }
    current = details.cause
  }
  return [...lines, ...ownFrames(error)].join('\n')
}

function detailLines({ code, detail, location, notes }: ErrorDetails) {
  const lines: string[] = []
  if (typeof code === 'string' || typeof code === 'number') {
    lines.push(`  code: ${code}`)
  }
  if (typeof detail === 'string') lines.push(`  ${shorten(detail)}`)
  if (typeof location?.file === 'string') {
    const where = [location.file, location.line, location.column]
      .filter((part) => typeof part === 'string' || typeof part === 'number')
      .join(':')
    const text =
      typeof location.lineText === 'string' ? location.lineText.trim() : ''
    lines.push(`  ${where}${text ? `: ${text}` : ''}`)
  }
  for (const note of notes ?? []) {
    if (typeof note.text === 'string') {
      lines.push(`  ${shorten(note.text).replaceAll('\n', '\n  ')}`)
    }
  }
  return lines
}

/** Stack frames of the outermost error outside dependencies and Node.js itself. */
function ownFrames(error: unknown): string[] {
  if (!(error instanceof Error) || !error.stack) return []
  return error.stack
    .split('\n')
    .filter(
      (line) =>
        /^\s+at /.test(line) && !/node_modules|\(node:|at node:/.test(line),
    )
}

function shorten(message: string): string {
  return message.length > MAX_LENGTH
    ? `${message.slice(0, MAX_LENGTH)}… (${message.length} characters)`
    : message
}
