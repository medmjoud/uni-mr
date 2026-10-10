import { z } from 'astro/zod'
import en from '@/data/context.json'
import fr from '@/data/i18n/context.fr.json'
import ar from '@/data/i18n/context.ar.json'
import type { Locale } from '@/i18n'

// Guides content (admissions, scholarships, key figures, FAQ): English in context.json,
// French and Arabic in data/i18n/. Validated at build time so a malformed edit fails the
// build instead of shipping a broken page.
const source = z.object({ title: z.string(), url: z.url() })
const link = z.looseObject({ name: z.string(), url: z.url() })

const schema = z.object({
  keyFigures: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      year: z.union([z.number(), z.string()]).nullable(),
      note: z.string().nullable().optional(),
      source,
    }),
  ),
  system: z.object({
    ministry: z.object({ name: z.string(), nameAr: z.string().nullable().optional(), url: z.url() }),
    structure: z.array(z.object({ degree: z.string(), duration: z.string(), description: z.string() })),
    languages: z.string(),
    calendar: z.string(),
    qualityAgency: link.partial({ url: true }).nullable(),
    studentServices: link.partial({ url: true }).nullable(),
    sources: z.array(source),
  }),
  admissions: z.object({
    steps: z.array(z.object({ title: z.string(), description: z.string() })),
    platform: link.nullable(),
    bacSeries: z.array(z.object({ code: z.string(), name: z.string(), typicalPaths: z.string() })),
    documents: z.array(z.string()),
    international: z.string(),
    sources: z.array(source),
  }),
  scholarships: z.array(
    z.object({
      name: z.string(),
      provider: z.string(),
      level: z.string(),
      description: z.string(),
      url: z.url(),
      scope: z.enum(['national', 'international']),
    }),
  ),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
})

const contexts = { en: schema.parse(en), fr: schema.parse(fr), ar: schema.parse(ar) }

export type Context = z.infer<typeof schema>

export function getContext(lang: Locale): Context {
  return contexts[lang]
}
