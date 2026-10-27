// Keeps a text copy of each school's own web pages (its website plus any source on the same site)
// and reports what changed since the last run. Usage: `pnpm watch-pages <snapshot dir>`.
// The weekly GitHub workflow keeps the copies on the page-snapshots branch and posts the report
// to an issue. A page that can't be reached keeps its previous copy; the link check covers that.
import { createHash } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { HEADERS, TIMEOUT_MS, mapLimit } from './http.mjs'

const DIR = process.argv[2]
if (!DIR) throw new Error('Pass the snapshot directory, e.g. `pnpm watch-pages snapshots`')
const CONCURRENCY = 6
const SHOWN_LINES = 8

const host = (url) => new URL(url).hostname.replace(/^www\./, '')
/** The same page with or without a trailing slash on the homepage is one page. */
const normalize = (url) => new URL(url).href.replace(/\/$/, '')

/** The institution's website and every source it cites from that same site. */
function watchedPages(institutions) {
  return institutions.flatMap((i) => {
    if (!i.website) return []
    const urls = [i.website, ...i.sources.map((s) => s.url).filter((url) => host(url) === host(i.website))]
    return [...new Set(urls.map(normalize))].map((url) => ({ institution: i, url }))
  })
}

// The named entities these sites use; anything else is left as written.
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—',
  laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', copy: '©',
  agrave: 'à', acirc: 'â', ccedil: 'ç', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  icirc: 'î', iuml: 'ï', ocirc: 'ô', oelig: 'œ', ugrave: 'ù', ucirc: 'û', Eacute: 'É', rarr: '→', times: '×',
}

/** The readable text of an HTML page, one block (heading, paragraph, list item…) per line. */
function pageText(html) {
  return html
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/?(p|div|li|tr|td|th|h[1-6]|section|article|header|footer|nav|ul|ol|table|dt|dd|title|option|blockquote))\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
      if (code[0] === '#') return String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1)))
      return ENTITIES[code] ?? ENTITIES[code.toLowerCase()] ?? match
    })
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 1)
}

/** Text lines for HTML and other text; a fingerprint for PDFs and images, so a new version still shows up. */
async function fetchLines(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) {
      await res.body?.cancel()
      return null
    }
    const type = res.headers.get('content-type') ?? ''
    if (type.includes('html')) return pageText(await res.text())
    if (type.startsWith('text/') || type.includes('json')) return (await res.text()).split('\n').map((l) => l.trim()).filter(Boolean)
    const hash = createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex')
    return [`${type || 'file'}, sha256 ${hash}`]
  } catch {
    return null
  }
}

/** File for one page, e.g. snapshots/iscae/iscae.mr-node-21.txt */
const snapshotPath = (id, url) => {
  const { hostname, pathname, search } = new URL(url)
  const slug = `${hostname.replace(/^www\./, '')}${pathname}${search}`.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
  return join(DIR, id, `${slug.slice(0, 120)}.txt`)
}

async function readSnapshot(path) {
  try {
    // The first two lines are the URL and a blank line.
    return (await readFile(path, 'utf8')).split('\n').slice(2).filter(Boolean)
  } catch {
    return null
  }
}

async function listSnapshots(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => [])
  return entries.filter((e) => e.isFile() && e.name.endsWith('.txt')).map((e) => join(e.parentPath, e.name))
}

const institutions = JSON.parse(await readFile(new URL('../src/data/institutions.json', import.meta.url), 'utf8'))
const pages = watchedPages(institutions)
const before = await listSnapshots(DIR)
const firstRun = before.length === 0

const changes = []
let unreachable = 0
await mapLimit(pages, CONCURRENCY, async ({ institution, url }) => {
  const path = snapshotPath(institution.id, url)
  const lines = await fetchLines(url)
  if (!lines) {
    unreachable++
    return
  }
  const old = await readSnapshot(path)
  if (old && old.join('\n') !== lines.join('\n')) {
    const oldSet = new Set(old)
    const newSet = new Set(lines)
    changes.push({
      institution,
      url,
      added: lines.filter((l) => !oldSet.has(l)),
      removed: old.filter((l) => !newSet.has(l)),
    })
  }
  await mkdir(join(DIR, institution.id), { recursive: true })
  await writeFile(path, `${url}\n\n${lines.join('\n')}\n`)
})

// Drop copies of pages that are no longer watched (a school's website or sources changed).
const watched = new Set(pages.map((p) => snapshotPath(p.institution.id, p.url)))
for (const path of before) if (!watched.has(path)) await rm(path)

const today = new Date().toISOString().slice(0, 10)
const lines = []
if (firstRun) {
  lines.push(`Saved a first copy of ${pages.length - unreachable} pages on ${today}. Changes will be reported from the next run.`)
} else {
  lines.push(`Compared ${pages.length - unreachable} school pages with the last run on ${today}. ${changes.length || 'None'} changed.`)
  if (unreachable) lines.push('', `${unreachable} ${unreachable === 1 ? 'page' : 'pages'} couldn't be reached and kept the previous copy.`)
}

const quote = (line) => `> ${line.length > 200 ? `${line.slice(0, 200)}…` : line}`
const excerpt = (label, rows) => {
  if (!rows.length) return []
  const more = rows.length > SHOWN_LINES ? [`> …and ${rows.length - SHOWN_LINES} more`] : []
  return [`${label}:`, '', ...rows.slice(0, SHOWN_LINES).map(quote), ...more, '']
}
changes.sort((a, b) => a.institution.name.localeCompare(b.institution.name, 'fr') || a.url.localeCompare(b.url))
for (const { institution, url, added, removed } of changes) {
  lines.push('', `### ${institution.name} (\`${institution.id}\`)`, '', url, '')
  lines.push(...excerpt('Added', added), ...excerpt('Removed', removed))
  if (!added.length && !removed.length) lines.push('Only the order of the text changed.', '')
}
if (changes.length) {
  lines.push('', 'If a change affects the site, update the data with its source and set that school\'s `verified` date.')
}

// GitHub refuses comments over 65,536 characters; the full diff is linked under the report.
const report = lines.join('\n')
console.log(report.length > 60_000 ? `${report.slice(0, 60_000)}\n\n…cut short here, see the full diff below.` : report)
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changes.length}\n`)
console.error(`${changes.length} changed, ${unreachable} unreachable, snapshots in ${DIR}`)
