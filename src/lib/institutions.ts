import { getCollection, type CollectionEntry } from 'astro:content'
import { TERMS, CITY_NAMES } from '@/i18n/terms'
import type { Locale } from '@/i18n'
import { normalizeSearch } from './search'
import fr from '@/data/i18n/institutions.fr.json'
import ar from '@/data/i18n/institutions.ar.json'
import data from '@/data/institutions.json'

export type Institution = CollectionEntry<'institutions'>

/** Every institution has been checked against its sources on or after this date: the oldest `verified`. */
export const LAST_VERIFIED = data.map((i) => i.verified).sort()[0]

type Localized = { summary: string; highlights: string[]; admission: string | null }
const translations: Partial<Record<Locale, Record<string, Partial<Localized>>>> = { fr, ar }

/**
 * Descriptive text in the reader's language. English is the base in institutions.json;
 * French and Arabic come from data/i18n/. `translated` is false when we fell back to English.
 */
export function localized(entry: Institution, lang: Locale): Localized & { translated: boolean } {
  const base = { summary: entry.data.summary, highlights: entry.data.highlights, admission: entry.data.admission }
  const t = translations[lang]?.[entry.id]
  if (lang === 'en' || !t?.summary) return { ...base, translated: lang === 'en' }
  return {
    summary: t.summary,
    highlights: t.highlights?.length ? t.highlights : base.highlights,
    admission: t.admission ?? base.admission,
    translated: true,
  }
}

export async function getInstitutions() {
  const entries = await getCollection('institutions')
  return entries.sort((a, b) => a.data.name.localeCompare(b.data.name, 'fr'))
}

export function countBy<T>(items: T[], key: (item: T) => string | string[]) {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const value of [key(item)].flat()) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/** Search text covering every language, so a query in any of them finds the institution. */
export function searchText(entry: Institution) {
  const d = entry.data
  const terms = d.fields.flatMap((f) => (TERMS[f] ? Object.values(TERMS[f]) : [f]))
  return normalizeSearch(
    [d.name, d.nameEn, d.nameAr, d.acronym, d.city, CITY_NAMES[d.city], d.wilaya, ...terms, ...d.faculties]
      .filter(Boolean)
      .join(' '),
  )
}

/** Two-letter monogram for institutions without an acronym. */
export function monogram(entry: Institution) {
  if (entry.data.acronym) return entry.data.acronym
  const words = entry.data.name
    .split(/[\s'’-]+/)
    .filter((w) => w.length > 2 && !/^(des|del|les|pour|and|of|the|de|du|la|le)$/i.test(w))
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function hostname(url: string) {
  return new URL(url).hostname.replace(/^www\./, '')
}

/** Related institutions: same city first, then shared fields of study. */
export function related(entry: Institution, all: Institution[], limit = 3) {
  const fields = new Set(entry.data.fields)
  return all
    .filter((other) => other.id !== entry.id)
    .map((other) => ({
      other,
      score:
        (other.data.city === entry.data.city ? 2 : 0) +
        other.data.fields.filter((f) => fields.has(f)).length,
    }))
    .sort((a, b) => b.score - a.score || a.other.data.name.localeCompare(b.other.data.name))
    .slice(0, limit)
    .map(({ other }) => other)
}
