import { defineCollection } from 'astro:content'
import { file } from 'astro/loaders'
import { z } from 'astro/zod'

import snapshot from './data/worldbank-snapshot.json'

const source = z.object({ title: z.string(), url: z.url() })

const institutions = defineCollection({
  loader: file('src/data/institutions.json'),
  schema: z.object({
    name: z.string(),
    nameAr: z.string().nullable(),
    nameEn: z.string(),
    acronym: z.string().nullable(),
    type: z.enum(['public', 'private']),
    category: z.enum([
      'university',
      'engineering-school',
      'institute',
      'professional-school',
      'religious-studies',
      'business-school',
      'health-school',
    ]),
    city: z.string(),
    wilaya: z.string().nullable(),
    founded: z.number().int().nullable(),
    studentCount: z.number().int().nullable(),
    studentCountYear: z.number().int().nullable(),
    faculties: z.array(z.string()),
    fields: z.array(z.string()),
    degrees: z.array(z.string()),
    languages: z.array(z.string()),
    website: z.url().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    coordinates: z.tuple([z.number(), z.number()]),
    coordinatesPrecision: z.enum(['campus', 'city']),
    wikidata: z.string().nullable(),
    wikipedia: z.url().nullable(),
    summary: z.string(),
    highlights: z.array(z.string()),
    admission: z.string().nullable(),
    sources: z.array(source).min(1),
  }),
})

// World Bank Open Data indicators for Mauritania, fetched live at build time.
// Falls back to the committed snapshot so an offline or failed build still works.
const INDICATORS = {
  'SE.TER.ENRR': 'Gross enrollment ratio, tertiary (%)',
  'SE.TER.ENRR.FE': 'Gross enrollment ratio, tertiary, female (%)',
  'SE.TER.ENRR.MA': 'Gross enrollment ratio, tertiary, male (%)',
  'SE.TER.ENRL': 'Tertiary enrollment (students)',
} as const

type Point = { year: number; value: number }

async function fetchIndicator(code: string): Promise<Point[]> {
  const url = `https://api.worldbank.org/v2/country/MRT/indicator/${code}?format=json&per_page=80`
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`World Bank ${code}: HTTP ${res.status}`)
  const [, rows] = (await res.json()) as [unknown, { date: string; value: number | null }[] | null]
  return (rows ?? [])
    .filter((row) => row.value !== null)
    .map((row) => ({ year: Number(row.date), value: row.value as number }))
    .sort((a, b) => a.year - b.year)
}

const indicators = defineCollection({
  loader: async () => {
    return Promise.all(
      Object.entries(INDICATORS).map(async ([id, label]) => {
        try {
          const series = await fetchIndicator(id)
          if (series.length === 0) throw new Error('empty series')
          return { id, label, series, live: true }
        } catch (error) {
          console.warn(`[indicators] using snapshot for ${id}: ${(error as Error).message}`)
          const series = (snapshot as Record<string, Point[]>)[id] ?? []
          return { id, label, series, live: false }
        }
      }),
    )
  },
  schema: z.object({
    label: z.string(),
    series: z.array(z.object({ year: z.number(), value: z.number() })),
    live: z.boolean(),
  }),
})

export const collections = { institutions, indicators }
