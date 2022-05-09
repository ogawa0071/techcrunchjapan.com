export function dateToString(date: Date) {
  return date.toLocaleDateString('ja', {
    year: 'numeric',
    month: 'narrow',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  })
}

export function dateToUrl(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `/${year.toString().padStart(4, '0')}/${month
    .toString()
    .padStart(2, '0')}/${day.toString().padStart(2, '0')}`
}
