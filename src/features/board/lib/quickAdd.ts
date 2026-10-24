import {
  addDays,
  nextWeekday,
  toLocalDateValue,
  weekendStart,
} from '@/lib/dates'
import { PRIORITY_LEVELS } from '@/app/lib/task'
import { Category, TaskRecurrence } from '@/app/types'

// Reads due date, time, repeat, priority and category typed into a task title:
//   "Pay rent tomorrow 9am #personal !high every month"
// Pure and timezone-aware (everything is local), so the form can preview it as you type.

export interface QuickAdd {
  title: string
  date?: string // 'YYYY-MM-DD', local
  time?: string // 'HH:mm', local
  recurrence?: TaskRecurrence
  priority?: number
  categoryId?: string
  // The words read as fields, in the order typed, to show what was understood.
  matched: string[]
}

const WEEKDAYS: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
}

const PRIORITY_WORDS: Record<string, number> = {
  low: PRIORITY_LEVELS[0].value,
  med: PRIORITY_LEVELS[1].value,
  medium: PRIORITY_LEVELS[1].value,
  high: PRIORITY_LEVELS[2].value,
  critical: PRIORITY_LEVELS[3].value,
  urgent: PRIORITY_LEVELS[3].value,
  ...Object.fromEntries(
    PRIORITY_LEVELS.map((l, i) => [String(i + 1), l.value])
  ),
}

const PERIODS: Record<string, Exclude<TaskRecurrence, 'never'>> = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  yearly: 'yearly',
}
const EVERY: Record<string, Exclude<TaskRecurrence, 'never'>> = {
  day: 'daily',
  week: 'weekly',
  month: 'monthly',
  year: 'yearly',
}

const TIME_12H = /^(\d{1,2})(?::([0-5]\d))?(am|pm)$/
const TIME_24H = /^([01]?\d|2[0-3]):([0-5]\d)$/
const pad = (n: number) => String(n).padStart(2, '0')

// 'HH:mm' from "9am", "9:30pm" or "18:00"; null if it isn't a time.
function readTime(word: string): string | null {
  const h12 = TIME_12H.exec(word)
  if (h12) {
    const hour = Number(h12[1])
    if (hour < 1 || hour > 12) return null
    const h = (hour % 12) + (h12[3] === 'pm' ? 12 : 0)
    return `${pad(h)}:${h12[2] ?? '00'}`
  }
  const h24 = TIME_24H.exec(word)
  return h24 ? `${pad(Number(h24[1]))}:${h24[2]}` : null
}

// The coming `weekday`, today included.
const comingWeekday = (now: Date, weekday: number) =>
  now.getDay() === weekday ? new Date(now) : nextWeekday(now, weekday)

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '')

// "#pers" matches "Personal" when no other category starts the same way.
function findCategory(tag: string, categories: Category[]) {
  const wanted = normalize(tag)
  if (!wanted) return undefined
  const exact = categories.find((c) => normalize(c.name) === wanted)
  if (exact) return exact
  const byPrefix = categories.filter((c) =>
    normalize(c.name).startsWith(wanted)
  )
  return wanted.length >= 2 && byPrefix.length === 1 ? byPrefix[0] : undefined
}

export function parseQuickAdd(
  text: string,
  categories: Category[],
  now = new Date()
): QuickAdd {
  const words = text.split(/\s+/).filter(Boolean)
  const lower = words.map((w) => w.toLowerCase().replace(/[.,;]+$/, ''))
  const kept: string[] = []
  const result: QuickAdd = { title: text.trim(), matched: [] }
  let weekdayFromRepeat: number | undefined

  // Each field is read once; later repeats of it stay in the title.
  const take = (count: number, i: number) => {
    result.matched.push(words.slice(i, i + count).join(' '))
    return count
  }

  for (let i = 0; i < words.length;) {
    const w = lower[i]
    const next = lower[i + 1]
    let used = 0
    // Plain words only count after the title starts: "Daily standup", "Friday drinks".
    const inTitle = kept.length > 0

    if (inTitle && !result.date) {
      if (w === 'today' || w === 'hoy') {
        result.date = toLocalDateValue(now)
        used = take(1, i)
      } else if (
        w === 'tomorrow' ||
        w === 'tmr' ||
        w === 'mañana' ||
        w === 'manana'
      ) {
        result.date = toLocalDateValue(addDays(now, 1))
        used = take(1, i)
      } else if (w === 'weekend' || (w === 'this' && next === 'weekend')) {
        result.date = toLocalDateValue(weekendStart(now))
        used = take(w === 'this' ? 2 : 1, i)
      } else if (w === 'next' && next === 'week') {
        result.date = toLocalDateValue(nextWeekday(now, 1))
        used = take(2, i)
      } else if (w in WEEKDAYS) {
        result.date = toLocalDateValue(comingWeekday(now, WEEKDAYS[w]))
        used = take(1, i)
      }
    }

    if (inTitle && !used && !result.time) {
      // "at 9am", "9am", "9 am", "18:00"
      const at = w === 'at' ? 1 : 0
      const first = lower[i + at]
      const joined =
        first && lower[i + at + 1]?.match(/^(am|pm)$/)
          ? first + lower[i + at + 1]
          : undefined
      const time = (joined && readTime(joined)) || (first && readTime(first))
      if (time) {
        result.time = time
        used = take(at + (joined && readTime(joined) ? 2 : 1), i)
      }
    }

    if (inTitle && !used && !result.recurrence) {
      if (w in PERIODS) {
        result.recurrence = PERIODS[w]
        used = take(1, i)
      } else if (w === 'every' && next && next in EVERY) {
        result.recurrence = EVERY[next]
        used = take(2, i)
      } else if (w === 'every' && next && next in WEEKDAYS) {
        result.recurrence = 'weekly'
        weekdayFromRepeat = WEEKDAYS[next]
        used = take(2, i)
      }
    }

    if (!used && result.priority === undefined && w.startsWith('!')) {
      const level = PRIORITY_WORDS[w.slice(1)]
      if (level !== undefined) {
        result.priority = level
        used = take(1, i)
      }
    }

    if (!used && !result.categoryId && w.startsWith('#')) {
      const category = findCategory(w.slice(1), categories)
      if (category) {
        result.categoryId = category.id
        used = take(1, i)
      }
    }

    if (used) {
      i += used
    } else {
      kept.push(words[i])
      i += 1
    }
  }

  const title = kept.join(' ')
  // Only fields typed: treat it all as the title (a task called "Tomorrow" is fine).
  if (!title) return { title: text.trim(), matched: [] }
  result.title = title

  // Fill in what the other fields imply.
  if (!result.date && weekdayFromRepeat !== undefined) {
    result.date = toLocalDateValue(comingWeekday(now, weekdayFromRepeat))
  }
  if (!result.date && (result.time || result.recurrence)) {
    // A time alone means the next time it comes around.
    const today = toLocalDateValue(now)
    const passed =
      !!result.time &&
      result.time <= `${pad(now.getHours())}:${pad(now.getMinutes())}`
    result.date = passed ? toLocalDateValue(addDays(now, 1)) : today
  }
  return result
}
