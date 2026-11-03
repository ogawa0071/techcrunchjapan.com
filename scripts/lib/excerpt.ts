import { Parser } from 'htmlparser2'

import { EXCERPT_LENGTH } from '../../src/lib/site'
import { truncate } from '../../src/lib/text'

/** Elements whose text is never visible prose (embed scripts, CSS, ...). */
const SKIPPED = new Set([
  'head',
  'iframe',
  'math',
  'noscript',
  'object',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
  'title',
])

/** Elements that visually separate text; whitespace is inserted around them. */
const BLOCKS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'br',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'summary',
  'table',
  'td',
  'th',
  'tr',
  'ul',
])

/** Extracts readable plain text from an HTML fragment (entities decoded, whitespace collapsed). */
export function htmlToText(html: string): string {
  let text = ''
  let skipDepth = 0
  const parser = new Parser(
    {
      onopentag(name) {
        if (SKIPPED.has(name)) skipDepth++
        else if (BLOCKS.has(name)) text += ' '
      },
      onclosetag(name) {
        if (SKIPPED.has(name)) skipDepth = Math.max(0, skipDepth - 1)
        else if (BLOCKS.has(name)) text += ' '
      },
      ontext(data) {
        if (skipDepth === 0) text += data
      },
    },
    { decodeEntities: true },
  )
  parser.write(html)
  parser.end()
  return text.replace(/\s+/g, ' ').trim()
}

/** Plain-text lead of an article as stored in `posts.excerpt` (cut by characters). */
export function toExcerpt(html: string, maxLength = EXCERPT_LENGTH): string {
  return truncate(htmlToText(html), maxLength)
}
