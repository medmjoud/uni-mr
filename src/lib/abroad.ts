import { z } from 'astro/zod'
import stats from '@/data/abroad-stats.json'
import en from '@/data/abroad.json'
import fr from '@/data/i18n/abroad.fr.json'
import ar from '@/data/i18n/abroad.ar.json'
import type { Locale } from '@/i18n'

// Study abroad page: placement figures from the ministry's orientation data
// (refreshed with `pnpm abroad`), joined with the sourced text in data/abroad.json
// and its French and Arabic versions.
const source = z.object({ title: z.string(), url: z.url() })
const label = z.object({ fr: z.string(), ar: z.string(), en: z.string() })

const statsSchema = z.object({
  source,
  fetchedAt: z.iso.date(),
  countries: z.record(z.string(), label),
  years: z
    .array(
      z.object({
        year: z.string(),
        totals: z.object({ licence: z.number().int(), master: z.number().int() }),
        licence: z.array(
          z.object({
            country: z.string(),
            code: z.string(),
            label,
            placed: z.number().int(),
            series: z.array(
              z.object({ code: z.string(), label, placed: z.number().int(), first: z.number().int(), last: z.number().int() }),
            ),
          }),
        ),
        master: z.array(
          z.object({
            country: z.string(),
            placed: z.number().int(),
            licences: z.number().int(),
            institutions: z.array(z.string()),
          }),
        ),
      }),
    )
    .min(1),
})

const contentSchema = z.object({
  policy: z.array(z.object({ text: z.string(), source })),
  steps: z.array(z.object({ when: z.string(), title: z.string(), description: z.string() })),
  master: z.string(),
  countries: z.array(
    z.object({
      code: z.string(),
      summary: z.string(),
      schemes: z.array(z.object({ name: z.string(), description: z.string(), url: z.url() })),
      sources: z.array(source),
    }),
  ),
  sources: z.array(source),
})

const data = statsSchema.parse(stats)
const contents = { en: contentSchema.parse(en), fr: contentSchema.parse(fr), ar: contentSchema.parse(ar) }

type Year = (typeof data.years)[number]

const placed = (rows: { country: string; placed: number }[], country: string) =>
  rows.filter((r) => r.country === country).reduce((n, r) => n + r.placed, 0)

export function getAbroad(lang: Locale) {
  const content = contents[lang]
  const years = [...data.years].sort((a, b) => a.year.localeCompare(b.year))
  const latest = years.at(-1) as Year

  const countries = content.countries
    .map((c) => {
      const programmes = latest.licence
        .filter((p) => p.country === c.code && p.placed > 0)
        .map((p) => ({
          code: p.code,
          name: p.label[lang],
          placed: p.placed,
          series: p.series.map((s) => ({ code: s.code, name: s.label[lang], placed: s.placed, last: s.last })),
        }))
      const master = latest.master.find((m) => m.country === c.code) ?? null
      return {
        ...c,
        name: data.countries[c.code]?.[lang] ?? c.code,
        // Placements per academic year, oldest first, for the summary table.
        history: years.map((y) => ({ year: y.year, licence: placed(y.licence, c.code), master: placed(y.master, c.code) })),
        licence: placed(latest.licence, c.code),
        master,
        programmes,
        sources: [data.source, ...c.sources],
      }
    })
    .sort((a, b) => b.licence + (b.master?.placed ?? 0) - (a.licence + (a.master?.placed ?? 0)))

  return {
    ...content,
    countries,
    years: years.map((y) => y.year),
    latest: {
      year: latest.year,
      licence: latest.licence.reduce((n, p) => n + p.placed, 0),
      master: latest.master.reduce((n, m) => n + m.placed, 0),
      programmes: latest.licence.length,
      countries: new Set([...latest.licence, ...latest.master].filter((r) => r.placed > 0).map((r) => r.country)).size,
    },
    statsSource: data.source,
    fetchedAt: data.fetchedAt,
  }
}

export type Abroad = ReturnType<typeof getAbroad>
