const namedEntities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  middot: '·',
  times: '×',
  yen: '¥',
  copy: '©',
  reg: '®',
}

function decodeEntity(entity: string, name: string) {
  if (name[0] === '#') {
    const codePoint =
      name[1] === 'x' || name[1] === 'X'
        ? parseInt(name.slice(2), 16)
        : parseInt(name.slice(1), 10)

    return codePoint > 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : entity
  }

  return namedEntities[name.toLowerCase()] ?? entity
}

/**
 * Extracts the text of rendered WordPress content for excerpts and
 * descriptions. Whitespace that only separates block elements is dropped.
 */
export function htmlToText(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/>\s*\n\s*</g, '><')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, decodeEntity)
    .trim()
}
