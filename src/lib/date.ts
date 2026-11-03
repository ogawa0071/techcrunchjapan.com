// Articles are dated in Japan Standard Time. Japan has not observed DST since 1951,
// so a fixed UTC+9 offset is exact and avoids depending on the runtime's ICU data.
const JST_OFFSET_MS = 9 * 60 * 60 * 1000

function jstParts(date: Date) {
  const jst = new Date(date.getTime() + JST_OFFSET_MS)
  return { year: jst.getUTCFullYear(), month: jst.getUTCMonth() + 1, day: jst.getUTCDate() }
}

const pad = (value: number, length = 2) => value.toString().padStart(length, '0')

/** `2022年3月31日` */
export function formatDate(date: Date): string {
  const { year, month, day } = jstParts(date)
  return `${year}年${month}月${day}日`
}

/** `/2022/03/31` */
export function datePath(date: Date): string {
  const { year, month, day } = jstParts(date)
  return `/${pad(year, 4)}/${pad(month)}/${pad(day)}`
}

/** Start of the given JST calendar year as a UTC instant. */
export function startOfJstYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1) - JST_OFFSET_MS)
}
