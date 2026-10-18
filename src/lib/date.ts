// Japan has not observed daylight saving time since 1951, so JST is a fixed offset.
const jstOffset = 9 * 60 * 60 * 1000

function toJst(date: Date) {
  const jst = new Date(date.getTime() + jstOffset)

  return {
    year: jst.getUTCFullYear(),
    month: jst.getUTCMonth() + 1,
    day: jst.getUTCDate(),
  }
}

export function dateToString(date: Date) {
  const { year, month, day } = toJst(date)

  return `${year}年${month}月${day}日`
}

export function dateToUrl(date: Date) {
  const { year, month, day } = toJst(date)

  return `/${year.toString().padStart(4, '0')}/${month
    .toString()
    .padStart(2, '0')}/${day.toString().padStart(2, '0')}`
}
