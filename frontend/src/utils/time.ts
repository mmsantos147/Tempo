export const APP_TIME_ZONE = 'America/Sao_Paulo'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export interface ZonedParts {
  date: string
  time: string
}

export function zonedParts(instant: string | number): ZonedParts {
  const value = typeof instant === 'string' ? Date.parse(instant) : instant
  const parts = Object.fromEntries(partsFormatter.formatToParts(value).map((part) => [part.type, part.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

export function todayInAppZone(): string {
  return zonedParts(Date.now()).date
}

export function nowTimeInAppZone(): string {
  return zonedParts(Date.now()).time
}

export function formatTime(instant: string): string {
  return zonedParts(instant).time
}

export function isIsoDate(value: string | undefined): value is string {
  if (!value || !DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

export function formatLongDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return longDateFormatter.format(Date.UTC(year, month - 1, day))
}

export function minutesBetween(startTime: string, endTime: string): number {
  return toMinutes(endTime) - toMinutes(startTime)
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const monthFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' })

export function monthOf(date: string): string {
  return date.slice(0, 7)
}

export function addMonths(month: string, months: number): string {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthIndex - 1 + months, 1)).toISOString().slice(0, 7)
}

export function monthRange(month: string): { from: string; to: string } {
  return { from: `${month}-01`, to: addDays(`${addMonths(month, 1)}-01`, -1) }
}

export function formatMonth(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number)
  return monthFormatter.format(Date.UTC(year, monthIndex - 1, 1))
}

export function monthGrid(month: string): (string | null)[] {
  const { from, to } = monthRange(month)
  const [year, monthIndex] = month.split('-').map(Number)
  const leading = new Date(Date.UTC(year, monthIndex - 1, 1)).getUTCDay()
  const days = Number(to.slice(8, 10))
  const cells: (string | null)[] = Array.from({ length: leading }, () => null)
  for (let day = 0; day < days; day++) cells.push(addDays(from, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
