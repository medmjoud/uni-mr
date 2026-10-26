// Validation and email formatting for the correction form. No Cloudflare imports, so tests can run it in Node.

export const LANGS = ['fr', 'ar', 'en'] as const
export type Lang = (typeof LANGS)[number]

export type CorrectionError = 'invalid' | 'busy' | 'send'

export interface Correction {
  lang: Lang
  about: string
  page: string
  message: string
  source: string
  email: string
}

export const LIMITS = { about: 200, page: 300, message: 3000, source: 500, email: 200 }
export const MIN_MESSAGE = 10

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/

const text = (form: FormData, name: string) => {
  const value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

/** A site path such as "/universities/x/", never a full URL or a protocol-relative "//host". */
const sitePath = (value: string) => (/^\/(?!\/)[^\s]*$/.test(value) ? value : '')

export function langPrefix(lang: Lang) {
  return lang === 'fr' ? '' : `/${lang}`
}

export type ParseResult =
  | { kind: 'spam'; lang: Lang }
  | { kind: 'invalid'; lang: Lang; about: string; page: string }
  | { kind: 'ok'; correction: Correction }

export function parseCorrection(form: FormData): ParseResult {
  const rawLang = text(form, 'lang')
  const lang: Lang = (LANGS as readonly string[]).includes(rawLang) ? (rawLang as Lang) : 'fr'
  // Hidden from people, so only bots fill it in.
  if (text(form, 'website')) return { kind: 'spam', lang }

  const about = text(form, 'about').slice(0, LIMITS.about)
  const page = sitePath(text(form, 'page')).slice(0, LIMITS.page)
  const message = text(form, 'message')
  const source = text(form, 'source')
  const email = text(form, 'email')

  const valid =
    message.length >= MIN_MESSAGE &&
    message.length <= LIMITS.message &&
    source.length <= LIMITS.source &&
    email.length <= LIMITS.email &&
    (email === '' || EMAIL_RE.test(email))
  if (!valid) return { kind: 'invalid', lang, about, page }

  return { kind: 'ok', correction: { lang, about, page, message, source, email } }
}

function base64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** RFC 2047 encoded word, so names and subjects can hold accents and Arabic. */
const encodeHeader = (value: string) => `=?UTF-8?B?${base64(value)}?=`

export function correctionSubject(c: Correction) {
  const topic = c.about || c.page || 'site'
  return `Correction: ${topic}`.slice(0, 150)
}

export function correctionBody(c: Correction, origin: string) {
  return [
    `Page: ${c.page ? origin + c.page : '(not given)'}`,
    `About: ${c.about || '(not given)'}`,
    `Language: ${c.lang}`,
    '',
    'What is wrong:',
    c.message,
    '',
    `Source: ${c.source || '(not given)'}`,
    `Reply to: ${c.email || '(no email given)'}`,
  ].join('\n')
}

/** A plain-text MIME message, base64-encoded so any language survives the trip. */
export function buildCorrectionEmail(c: Correction, opts: { from: string; to: string; origin: string; id: string; date: Date }) {
  const host = opts.from.split('@')[1]
  const headers = [
    `From: ${encodeHeader('Universités de Mauritanie')} <${opts.from}>`,
    `To: <${opts.to}>`,
    ...(c.email ? [`Reply-To: <${c.email}>`] : []),
    `Subject: ${encodeHeader(correctionSubject(c))}`,
    `Date: ${opts.date.toUTCString()}`,
    `Message-ID: <${opts.id}@${host}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
  ]
  const body = base64(correctionBody(c, opts.origin)).replace(/.{1,76}/g, '$&\r\n')
  return `${headers.join('\r\n')}\r\n\r\n${body}`
}
