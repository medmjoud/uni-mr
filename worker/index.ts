// Serves the static site and receives the correction form at /api/corrections, which it emails on.
import { EmailMessage } from 'cloudflare:email'
import { buildCorrectionEmail, langPrefix, parseCorrection, type CorrectionError, type Lang } from './correction'

const FROM = 'corrections@universitesmauritanie.com'
// Links in the email always point at the public site, whichever host received the form.
const SITE_ORIGIN = 'https://universitesmauritanie.com'

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/api/corrections') return env.ASSETS.fetch(request)
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
    return handleCorrection(request, env, url)
  },
} satisfies ExportedHandler<Env>

async function handleCorrection(request: Request, env: Env, url: URL) {
  // The page's script asks for JSON so it can keep what was typed on an error; without it the form posts and redirects.
  const wantsJson = request.headers.get('Accept')?.includes('application/json') ?? false

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const parsed = parseCorrection(form)
  const lang = parsed.kind === 'ok' ? parsed.correction.lang : parsed.lang
  const page = parsed.kind === 'spam' ? '' : parsed.kind === 'ok' ? parsed.correction.page : parsed.page
  const about = parsed.kind === 'invalid' ? parsed.about : parsed.kind === 'ok' ? parsed.correction.about : ''

  const sent = () => respond({ wantsJson, url, lang, ok: true, page })
  const failed = (error: CorrectionError) => respond({ wantsJson, url, lang, ok: false, error, page, about })

  if (parsed.kind === 'spam') return sent()
  if (parsed.kind === 'invalid') return failed('invalid')

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const { success } = await env.CORRECTIONS_LIMIT.limit({ key: ip })
  if (!success) return failed('busy')

  const raw = buildCorrectionEmail(parsed.correction, {
    from: FROM,
    to: env.CORRECTIONS_TO,
    origin: SITE_ORIGIN,
    id: crypto.randomUUID(),
    date: new Date(),
  })
  try {
    await env.CORRECTIONS_EMAIL.send(new EmailMessage(FROM, env.CORRECTIONS_TO, raw))
  } catch (err) {
    console.error('Correction email failed', err)
    return failed('send')
  }
  return sent()
}

function respond(r: { wantsJson: boolean; url: URL; lang: Lang; ok: boolean; error?: CorrectionError; page: string; about?: string }) {
  if (r.wantsJson) return Response.json(r.ok ? { ok: true } : { ok: false, error: r.error }, { status: r.ok ? 200 : 400 })

  const params = new URLSearchParams()
  if (r.error) params.set('error', r.error)
  if (r.about) params.set('about', r.about)
  if (r.page) params.set('page', r.page)
  const query = params.toString()
  const path = `${langPrefix(r.lang)}/corrections/${r.ok ? 'sent/' : ''}`
  return Response.redirect(new URL(path + (query ? `?${query}` : ''), r.url.origin).href, 303)
}
