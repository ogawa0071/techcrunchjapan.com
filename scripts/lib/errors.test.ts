import { DrizzleQueryError } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { describeError } from './errors'

/** Message lines only (stack frames depend on where the test runs). */
function messageLines(error: unknown) {
  return describeError(error)
    .split('\n')
    .filter((line) => !/^\s+at /.test(line))
}

describe('describeError', () => {
  it('shows where wrangler failed to parse its config', () => {
    const error = Object.assign(new Error('CommaExpected'), {
      name: 'ParseError',
      fileText: 'the whole file',
      location: {
        file: 'wrangler.jsonc',
        line: 38,
        column: 6,
        lineText: '      "migrations_dir": "drizzle",',
      },
      notes: [],
    })
    expect(messageLines(error)).toEqual([
      'ParseError: CommaExpected',
      '  wrangler.jsonc:38:6: "migrations_dir": "drizzle",',
    ])
  })

  it('follows causes and keeps the notes and codes of Cloudflare API errors', () => {
    const apiError = Object.assign(
      new Error('A request to the Cloudflare API (/accounts) failed.'),
      {
        name: 'APIError',
        code: 6003,
        notes: [
          {
            text: 'Invalid request headers [code: 6003]\n- Invalid format for Authorization header [code: 6111]',
          },
        ],
      },
    )
    const error = new Error(
      'Failed to start the remote proxy session. Error reloading remote server: A request to the Cloudflare API (/accounts) failed.',
      {
        cause: {
          type: 'error',
          reason: 'Error reloading remote server',
          cause: apiError,
        },
      },
    )
    expect(messageLines(error)).toEqual([
      'Error: Failed to start the remote proxy session. Error reloading remote server: A request to the Cloudflare API (/accounts) failed.',
      '  code: 6003',
      '  Invalid request headers [code: 6003]',
      '  - Invalid format for Authorization header [code: 6111]',
    ])
  })

  it("prints the driver's error of a failed query, not the statement", () => {
    const d1 = new Error('D1_ERROR: no such table: posts: SQLITE_ERROR', {
      cause: new Error('no such table: posts: SQLITE_ERROR'),
    })
    const error = new DrizzleQueryError(
      'select * from posts where id = ?',
      [1],
      d1,
    )
    expect(messageLines(error)).toEqual([
      'Error: D1_ERROR: no such table: posts: SQLITE_ERROR',
    ])
    expect(
      messageLines(new Error('Copying posts 1–100 failed', { cause: error })),
    ).toEqual([
      'Error: Copying posts 1–100 failed',
      'Caused by: Error: D1_ERROR: no such table: posts: SQLITE_ERROR',
    ])
  })

  it('lists the errors of an AggregateError', () => {
    const error = Object.assign(
      new AggregateError(
        [
          new Error('connect ECONNREFUSED ::1:3306'),
          new Error('connect ECONNREFUSED 127.0.0.1:3306'),
        ],
        '',
      ),
      { code: 'ECONNREFUSED' },
    )
    expect(messageLines(error)).toEqual([
      'AggregateError',
      '  code: ECONNREFUSED',
      '  - connect ECONNREFUSED ::1:3306',
      '  - connect ECONNREFUSED 127.0.0.1:3306',
    ])
  })

  it('shortens long messages', () => {
    const [line = ''] = messageLines(new Error('x'.repeat(10_000)))
    expect(line).toHaveLength(
      'Error: '.length + 500 + '… (10000 characters)'.length,
    )
  })

  it('describes thrown values that are not errors', () => {
    expect(messageLines('failed')).toEqual(['failed'])
  })
})
