// Deadlines are stored as UTC ISO strings and always shown/edited in the user's local time zone.
// A deadline without a specific time is stored as the end of that local day (23:59).

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const END_OF_DAY = '23:59'
const MS_PER_DAY = 24 * 60 * 60 * 1000

const pad = (n: number) => String(n).padStart(2, '0')

// Accepts ISO strings and legacy 'YYYY-MM-DD' values saved by the old date input.
export function parseDeadline(value?: string | null): Date | null {
  if (!value) return null
  const date = DATE_ONLY.test(value)
    ? new Date(`${value}T${END_OF_DAY}`)
    : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// 'YYYY-MM-DD' in local time, the format <input type="date"> expects.
export function toLocalDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// 'HH:mm' in local time, the format <input type="time"> expects.
export function toLocalTimeValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function hasSpecificTime(date: Date) {
  return toLocalTimeValue(date) !== END_OF_DAY
}

// Builds the stored ISO deadline from local date and optional time input values.
export function buildDeadline(dateValue: string, timeValue?: string) {
  if (!dateValue) return undefined
  const date = new Date(`${dateValue}T${timeValue || END_OF_DAY}`)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

// Splits a stored deadline back into local input values; time is '' for end-of-day deadlines.
export function splitDeadline(value?: string | null) {
  const date = parseDeadline(value)
  if (!date) return { date: '', time: '' }
  return {
    date: toLocalDateValue(date),
    time: hasSpecificTime(date) ? toLocalTimeValue(date) : '',
  }
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

// Whole local calendar days from `now` to `date` (0 = today, 1 = tomorrow, -1 = yesterday).
export function calendarDaysFrom(date: Date, now = new Date()) {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((startOf(date) - startOf(now)) / MS_PER_DAY)
}

const timeFormat = new Intl.DateTimeFormat('en', {
  hour: 'numeric',
  minute: '2-digit',
})
const weekdayFormat = new Intl.DateTimeFormat('en', { weekday: 'long' })
const shortDateFormat = new Intl.DateTimeFormat('en', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const longDateFormat = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

// Human label for a deadline, e.g. "Today, 6:00 PM", "Tomorrow", "Friday", "Mon, Nov 3".
export function formatDeadline(date: Date, now = new Date()) {
  const days = calendarDaysFrom(date, now)
  const time = hasSpecificTime(date) ? `, ${timeFormat.format(date)}` : ''

  let day: string
  if (days === 0) day = 'Today'
  else if (days === 1) day = 'Tomorrow'
  else if (days === -1) day = 'Yesterday'
  else if (days > 1 && days < 7) day = weekdayFormat.format(date)
  else if (date.getFullYear() === now.getFullYear())
    day = shortDateFormat.format(date)
  else day = longDateFormat.format(date)

  return `${day}${time}`
}

export function isOverdue(date: Date, now = new Date()) {
  return date.getTime() < now.getTime()
}

// "just now", "5 min ago", "3 h ago", "2 days ago".
export function formatAge(iso: string, now = new Date()) {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}
