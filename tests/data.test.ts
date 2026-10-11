import { describe, expect, it } from 'vitest'
import institutions from '../src/data/institutions.json'
import context from '../src/data/context.json'
import media from '../src/data/media.json'
import { existsSync, readdirSync } from 'node:fs'

// Rough bounding box of Mauritania, with a small margin.
const BOUNDS = { minLat: 14.5, maxLat: 27.5, minLon: -17.3, maxLon: -4.6 }

describe('institutions.json', () => {
  it('has unique kebab-case ids', () => {
    const ids = institutions.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('places every institution inside Mauritania', () => {
    for (const i of institutions) {
      const [lat, lon] = i.coordinates
      expect(lat, i.id).toBeGreaterThan(BOUNDS.minLat)
      expect(lat, i.id).toBeLessThan(BOUNDS.maxLat)
      expect(lon, i.id).toBeGreaterThan(BOUNDS.minLon)
      expect(lon, i.id).toBeLessThan(BOUNDS.maxLon)
    }
  })

  it('cites at least one https source per institution', () => {
    for (const i of institutions) {
      expect(i.sources.length, i.id).toBeGreaterThan(0)
      for (const s of i.sources) expect(s.url, i.id).toMatch(/^https?:\/\//)
    }
  })

  it('links websites over http(s) only', () => {
    for (const i of institutions) if (i.website) expect(i.website, i.id).toMatch(/^https?:\/\//)
  })

  it('has plausible founding years and student counts', () => {
    for (const i of institutions) {
      if (i.founded !== null) {
        expect(i.founded, i.id).toBeGreaterThan(1900)
        expect(i.founded, i.id).toBeLessThanOrEqual(new Date().getFullYear())
      }
      if (i.studentCount !== null) expect(i.studentCountYear, `${i.id} needs a year`).not.toBeNull()
    }
  })

  it('tags every institution with at least one field of study', () => {
    for (const i of institutions) expect(i.fields.length, i.id).toBeGreaterThan(0)
  })
})

describe('context.json', () => {
  it('only links scholarships over https', () => {
    for (const s of context.scholarships) expect(s.url, s.name).toMatch(/^https?:\/\//)
  })

  it('has admission steps and FAQ entries', () => {
    expect(context.admissions.steps.length).toBeGreaterThan(2)
    expect(context.faq.length).toBeGreaterThan(2)
  })
})

describe('translations', () => {
  const ids = institutions.map((i) => i.id).sort()

  it.each(['fr', 'ar'])('covers every institution in %s', async (lang) => {
    const t = (await import(`../src/data/i18n/institutions.${lang}.json`)).default as Record<
      string,
      { summary: string; highlights: string[] }
    >
    expect(Object.keys(t).sort()).toEqual(ids)
    for (const i of institutions) {
      expect(t[i.id].summary, `${lang}/${i.id}`).toBeTruthy()
      expect(t[i.id].highlights.length, `${lang}/${i.id}`).toBe(i.highlights.length)
    }
  })

  it.each(['fr', 'ar'])('mirrors the guide content structure in %s', async (lang) => {
    const shape = (o: unknown): unknown =>
      Array.isArray(o) ? o.map(shape) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)])) : typeof o
    const t = (await import(`../src/data/i18n/context.${lang}.json`)).default
    expect(shape(t)).toEqual(shape(context))
  })
})

describe('media.json', () => {
  const ids = new Set(institutions.map((i) => i.id))
  const logoFiles = readdirSync('src/assets/logos').map((f) => f.replace(/\.webp$/, ''))

  it('has a logo file for every logo source, and a source for every logo file', () => {
    expect(logoFiles.sort()).toEqual(Object.keys(media.logos).sort())
    for (const [id, url] of Object.entries(media.logos)) {
      expect(ids.has(id), id).toBe(true)
      expect(url, id).toMatch(/^https:\/\//)
    }
  })

  it('credits every photo with an author, license and existing file', () => {
    for (const [id, photo] of Object.entries(media.photos)) {
      expect(ids.has(id), id).toBe(true)
      expect(existsSync(`src/assets/photos/${photo.file}`), id).toBe(true)
      expect(photo.author && photo.license && photo.licenseUrl && photo.source, id).toBeTruthy()
      for (const lang of ['en', 'fr', 'ar'] as const) expect(photo.caption[lang], `${id} ${lang}`).toBeTruthy()
    }
  })
})
