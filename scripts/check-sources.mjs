// Opens every link in src/data/*.json and lists the ones that no longer work, plus institutions
// nobody has checked in over a year. Prints a Markdown report and exits with 1 when something
// needs fixing. Run with `pnpm sources`; the weekly GitHub workflow turns a failure into an issue.
import { readdir, readFile } from 'node:fs/promises'
import { HEADERS, TIMEOUT_MS, mapLimit } from './http.mjs'

const DATA = new URL('../src/data/', import.meta.url)
const STALE_DAYS = 365
const CONCURRENCY = 8

/** Every http(s) string in a JSON value, with the id or name of the record it sits in. */
function collectLinks(value, file, label, out) {
  if (typeof value === 'string') {
    // Archived snapshots never change, and the Wayback Machine rate-limits a burst of checks.
    if (/^https?:\/\//.test(value) && !value.includes('web.archive.org/web/')) out.push({ url: value, where: label ? `${file} → ${label}` : file })
  } else if (Array.isArray(value)) {
    for (const item of value) collectLinks(item, file, label, out)
  } else if (value && typeof value === 'object') {
    const own = value.id ?? value.name ?? label
    for (const item of Object.values(value)) collectLinks(item, file, own, out)
  }
}

/** `broken` means the page is gone; `unreachable` may be a slow server or one that blocks robots. */
async function check(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) })
    await res.body?.cancel()
    if (res.ok) return { status: 'ok' }
    if (res.status === 404 || res.status === 410) return { status: 'broken', reason: `HTTP ${res.status}` }
    if (res.status >= 500 && attempt === 1) return check(url, 2)
    return { status: 'unreachable', reason: `HTTP ${res.status}` }
  } catch (error) {
    const code = error.cause?.code ?? error.name
    if (code === 'ENOTFOUND') return { status: 'broken', reason: 'domain no longer exists' }
    if (attempt === 1) return check(url, 2)
    return { status: 'unreachable', reason: code === 'TimeoutError' ? 'timed out' : code }
  }
}

const links = []
for (const name of (await readdir(DATA)).filter((n) => n.endsWith('.json'))) {
  collectLinks(JSON.parse(await readFile(new URL(name, DATA), 'utf8')), name, null, links)
}

const byUrl = Map.groupBy(links, (link) => link.url)
const urls = [...byUrl.keys()]
const results = await mapLimit(urls, CONCURRENCY, check)
const failed = (status) =>
  urls.map((url, i) => ({ url, ...results[i], where: [...new Set(byUrl.get(url).map((l) => l.where))] })).filter((r) => r.status === status)
const broken = failed('broken')
const unreachable = failed('unreachable')

const institutions = JSON.parse(await readFile(new URL('institutions.json', DATA), 'utf8'))
const cutoff = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString().slice(0, 10)
const stale = institutions.filter((i) => i.verified < cutoff).sort((a, b) => a.verified.localeCompare(b.verified))

const lines = [`Checked ${urls.length} links in src/data on ${new Date().toISOString().slice(0, 10)}.`, '']
const linkList = (rows) => rows.map((r) => `- ${r.url} (${r.reason})\n  used in ${r.where.join(', ')}`)
if (broken.length) {
  lines.push(`## Broken links (${broken.length})`, '', 'These pages are gone. Find where the information moved, or replace the source.', '', ...linkList(broken), '')
}
if (stale.length) {
  lines.push(`## Not checked in over a year (${stale.length})`, '', 'Re-check these institutions against their sources, then update `verified`.', '')
  lines.push(...stale.map((i) => `- ${i.name} (\`${i.id}\`), last checked ${i.verified}`), '')
}
if (unreachable.length) {
  lines.push(`## Could not reach (${unreachable.length})`, '', 'Often temporary, or a site that blocks robots. Open them in a browser if they keep showing up.', '', ...linkList(unreachable), '')
}
if (!broken.length && !stale.length && !unreachable.length) lines.push('Every link works and every institution was checked within the last year.')

console.log(lines.join('\n'))
process.exitCode = broken.length || stale.length ? 1 : 0
