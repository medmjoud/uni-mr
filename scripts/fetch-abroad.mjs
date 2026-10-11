// Pulls the ministry's orientation statistics (etudiants-mesrs.app/affectations-stats) and keeps
// only placements outside Mauritania, for the study abroad page. Run with `pnpm abroad` and
// commit the result: the build reads the snapshot, so it never depends on the ministry API.
import { writeFile } from 'node:fs/promises'

const API = 'https://etudiants-mesrs.app/api'
const OUT = new URL('../src/data/abroad-stats.json', import.meta.url)
const FIRST_YEAR = 2024

// The API labels programmes, series and countries in French and Arabic only.
const EN_PROGRAMMES = {
  'UNDZ-MD': 'Dentistry',
  'UNDZ-MG': 'General medicine',
  'UNDZ-PH': 'Pharmacy',
  'UNMA-IST': 'Engineering and technology',
  'UNMA-CPGE': 'Preparatory classes for engineering schools',
  'UNMA-MG': 'General medicine',
  'UNMA-SCG': 'Business and management',
  'UNMA-PH': 'Pharmacy',
  'UNMA-ARC': 'Architecture',
  'UNMA-SAV': 'Agronomy and veterinary science',
  'FCZR-TS': 'Health technology',
  'UNSN-MG': 'General medicine (UCAD)',
  'UNSN-MGUIDT': 'General medicine (UIDT)',
  'UNSN-MD': 'Dentistry',
  'UNTN-LO': 'Licence at Tunisian universities',
  'UNTN-MG': 'General medicine',
  'UNTN-MD': 'Dentistry',
  'UNTN-PH': 'Pharmacy',
  'UNTR-MG': 'General medicine',
  'UNTR-IA': 'Artificial intelligence',
  'UNTR-INTR': 'International relations',
  'UNTR-BM': 'Medical biology',
  'UNTR-CYBERSEC': 'Cybersecurity',
  'UNTR-DRONE': 'Drone engineering',
  'UNTR-ER': 'Renewable energy',
  'UNTR-GA': 'Agricultural engineering',
  'UNTR-IPG': 'Petroleum and gas engineering',
  'UNTR-MD': 'Dentistry',
  'UNTR-MECAT': 'Mechatronics',
  'UNTR-PH': 'Pharmacy',
  'UNTR-PSYCO': 'Psychology',
  'UNTR-SPACE': 'Space engineering',
  'UNTR-SOCIO': 'Sociology',
}

const EN_SERIES = {
  M: 'Mathematics',
  SN: 'Natural sciences',
  LM: 'Modern letters',
  LO: 'Original letters',
  LA: 'Languages',
  TM: 'Mathematical techniques',
  TS: 'Technical sciences',
}

const EN_COUNTRIES = { DZ: 'Algeria', EG: 'Egypt', MA: 'Morocco', SN: 'Senegal', TN: 'Tunisia', TR: 'Türkiye' }

async function get(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (uni-mr data refresh)' },
    signal: AbortSignal.timeout(20_000),
  })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  const body = await res.json()
  return body.results ?? body
}

function en(map, key, fallback) {
  if (!map[key]) console.warn(`[abroad] no English label for ${key}, using French`)
  return map[key] ?? fallback
}

const countries = {}
const addCountry = (code, fr, ar) => {
  countries[code] ??= { fr, ar, en: en(EN_COUNTRIES, code, fr) }
}

for (const c of await get('/international-applications/countries/')) addCountry(c.code, c.name_fr, c.name_ar)

const years = []
const lastYear = new Date().getFullYear()
for (let y = FIRST_YEAR; y <= lastYear; y++) {
  const [licence, master] = await Promise.all([get(`/affectations/stats/lic/${y}/`), get(`/affectations/stats/master/${y}/`)])
  const abroad = (rows) => rows.filter((r) => r.country_code !== 'MR')
  // 2024-2025 was published without any placement abroad, so it has nothing to show here.
  if (abroad([...licence, ...master]).length === 0) continue

  for (const r of abroad([...licence, ...master])) addCountry(r.country_code, r.country_name_fr, r.country_name_ar)
  const sum = (rows) => rows.reduce((n, r) => n + r.total_affected_students, 0)

  years.push({
    year: (licence[0] ?? master[0]).academic_year,
    totals: { licence: sum(licence), master: sum(master) },
    licence: abroad(licence)
      .map((r) => ({
        country: r.country_code,
        code: r.degree_code,
        label: { fr: r.degree_label_fr, ar: r.degree_label_ar, en: en(EN_PROGRAMMES, r.degree_code, r.degree_label_fr) },
        placed: r.total_affected_students,
        series: r.ranks
          .filter((s) => s.total_affectation > 0)
          .map((s) => ({
            code: s.bac_serie ?? s.feeding_code,
            label: { fr: s.feeding_label_fr, ar: s.feeding_label_ar, en: en(EN_SERIES, s.feeding_code, s.feeding_label_fr) },
            placed: s.total_affectation,
            first: s.first_rank,
            last: s.last_rank,
          }))
          .sort((a, b) => b.placed - a.placed),
      }))
      .sort((a, b) => b.placed - a.placed),
    master: abroad(master)
      .map((r) => {
        const origins = r.ranks.filter((s) => s.total_affectation > 0)
        return {
          country: r.country_code,
          placed: r.total_affected_students,
          licences: origins.length,
          // Feeding codes look like "ISCAE-BA": institution, then licence.
          institutions: [...new Set(origins.map((s) => s.feeding_code.split('-')[0]))].sort(),
        }
      })
      .sort((a, b) => b.placed - a.placed),
  })
}

const snapshot = {
  source: { title: 'MESRS – Statistiques d’orientation (etudiants-mesrs.app)', url: 'https://etudiants-mesrs.app/affectations-stats' },
  fetchedAt: new Date().toISOString().slice(0, 10),
  countries,
  years,
}

await writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`)
console.log(`[abroad] wrote ${years.length} academic years, ${Object.keys(countries).length} countries`)
