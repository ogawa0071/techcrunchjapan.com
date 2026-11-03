import { describe, expect, it } from 'vitest'

import { htmlToText, toExcerpt } from './excerpt'

describe('htmlToText', () => {
  it('decodes entities and collapses whitespace', () => {
    expect(htmlToText('<p>A&amp;B&nbsp;&#8217;x&#x2014;</p>\n\n<p> next </p>')).toBe('A&B ’x— next')
  })

  it('drops scripts, styles and comments', () => {
    expect(
      htmlToText('<style>.a{}</style><!-- wp:paragraph --><p>本文</p><script>var p = "<p>no</p>"</script>'),
    ).toBe('本文')
  })

  it('separates block elements', () => {
    expect(htmlToText('<p>one</p><p>two</p><ul><li>three</li></ul>')).toBe('one two three')
  })
})

describe('toExcerpt', () => {
  it('cuts by characters without splitting surrogate pairs', () => {
    expect(toExcerpt('<p>😀😀😀</p>', 2)).toBe('😀😀')
  })
})
