import { z } from 'astro/zod'
import data from '@/data/calendar.json'
import { LOCALE_META, type Locale } from '@/i18n'

// Key dates calendar: Bac, orientation, registration and scholarship dates, each with the
// source it was taken from. Text is stored in all three languages next to the dates, so a
// date is only ever written once. "expected" dates are estimates from the previous year;
// the note says what they are based on.
const label = z.object({ en: z.string(), fr: z.string(), ar: z.string() })

const eventSchema = z
  .object({
    id: z.string(),
    category: z.enum(['bac', 'orientation', 'registration', 'scholarship']),
    status: z.enum(['confirmed', 'expected']),
    /** "month" dates are shown as months ("June 2027") and cover whole months. */
    precision: z.enum(['day', 'month']),
    start: z.iso.date(),
    end: z.iso.date(),
    title: label,
    note: label.nullable(),
    /** Institution ids the date concerns, "public" for every public institution, or null. */
    institutions: z.union([z.literal('public'), z.array(z.string())]).nullable(),
    url: z.url().nullable(),
    source: z.object({ title: z.string(), url: z.url() }),
    verified: z.iso.date(),
  })
  .refine((e) => e.start <= e.end, { message: 'end is before start' })

const events = z.object({ events: z.array(eventSchema) }).parse(data).events

export type Timing = 'past' | 'today' | 'open' | 'upcoming'
export type CalendarEvent = ReturnType<typeof localize>

/** Today's date as YYYY-MM-DD. Pages are static, so this is the build date; a client script refreshes it. */
export const todayISO = () => new Date().toISOString().slice(0, 10)

export function timing(start: string, end: string, today: string): Timing {
  if (end < today) return 'past'
  if (start > today) return 'upcoming'
  return start === end ? 'today' : 'open'
}

/**
 * Dates use Latin digits and the month names Mauritanian news sites use (أغسطس rather than
 * the ar-MR locale's أغشت), so they match the hand-written notes next to them.
 */
const formatter = (lang: Locale, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(`${lang === 'ar' ? 'ar' : LOCALE_META[lang].intl}-u-nu-latn`, { ...options, timeZone: 'UTC' })

export function formatDay(iso: string, lang: Locale) {
  return formatter(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

function formatWhen(e: z.infer<typeof eventSchema>, lang: Locale) {
  const options: Intl.DateTimeFormatOptions =
    e.precision === 'month' ? { month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' }
  return formatter(lang, options).formatRange(new Date(e.start), new Date(e.end))
}

function localize(e: z.infer<typeof eventSchema>, lang: Locale, today: string) {
  return {
    ...e,
    title: e.title[lang],
    note: e.note?.[lang] ?? null,
    when: formatWhen(e, lang),
    verifiedOn: formatDay(e.verified, lang),
    timing: timing(e.start, e.end, today),
  }
}

export function getCalendar(lang: Locale, today = todayISO()) {
  const all = events.map((e) => localize(e, lang, today))
  return {
    upcoming: all.filter((e) => e.timing !== 'past').sort((a, b) => a.start.localeCompare(b.start)),
    past: all.filter((e) => e.timing === 'past').sort((a, b) => b.end.localeCompare(a.end)),
  }
}

/** Dates still to come that concern one institution. */
export function upcomingFor(institution: { id: string; data: { type: string } }, lang: Locale, today = todayISO()) {
  return getCalendar(lang, today).upcoming.filter(
    (e) =>
      (e.institutions === 'public' && institution.data.type === 'public') ||
      (Array.isArray(e.institutions) && e.institutions.includes(institution.id)),
  )
}
