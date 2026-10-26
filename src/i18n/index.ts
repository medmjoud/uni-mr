import { ui, type UIKey } from './ui'
import { CITY_NAMES, TERMS } from './terms'

export const LOCALES = ['fr', 'ar', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** French is served at the site root; Arabic and English live under /ar/ and /en/. */
export const DEFAULT_LOCALE: Locale = 'fr'

export const LOCALE_META: Record<Locale, { label: string; short: string; dir: 'ltr' | 'rtl'; htmlLang: string; intl: string }> = {
  fr: { label: 'Français', short: 'FR', dir: 'ltr', htmlLang: 'fr', intl: 'fr-FR' },
  ar: { label: 'العربية', short: 'ع', dir: 'rtl', htmlLang: 'ar', intl: 'ar-MR' },
  en: { label: 'English', short: 'EN', dir: 'ltr', htmlLang: 'en', intl: 'en-GB' },
}

/** `params` for getStaticPaths in src/pages/[...lang]/: undefined renders the default locale at the root. */
export function langParams() {
  return LOCALES.map((lang) => ({ lang: lang === DEFAULT_LOCALE ? undefined : lang }))
}

export function toLocale(param: string | undefined): Locale {
  return (LOCALES as readonly string[]).includes(param ?? '') ? (param as Locale) : DEFAULT_LOCALE
}

/** Build a localized path. `path` is the locale-free path, e.g. "/admissions/". */
export function localePath(lang: Locale, path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`
  return lang === DEFAULT_LOCALE ? clean : `/${lang}${clean}`
}

/** Strip a locale prefix from a pathname, giving the path shared by every language version. */
export function stripLocale(pathname: string) {
  const match = pathname.match(/^\/(ar|en)(\/.*)?$/)
  return match ? match[2] || '/' : pathname
}

export function useTranslations(lang: Locale) {
  const dict = ui[lang]
  const t = (key: UIKey, vars?: Record<string, string | number>) => {
    let text: string = dict[key] ?? ui.en[key]
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v))
    return text
  }
  /** Translate a data term (field of study, degree, language). Falls back to the English term. */
  const term = (value: string) => TERMS[value]?.[lang] ?? value
  const city = (value: string) => (lang === 'ar' ? (CITY_NAMES[value] ?? value) : value)
  const num = (value: number) => value.toLocaleString(LOCALE_META[lang].intl === 'ar-MR' ? 'fr-FR' : LOCALE_META[lang].intl)
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(LOCALE_META[lang].intl, { day: 'numeric', month: 'long', year: 'numeric' })
  /** Join list items with the comma this language uses (Arabic has its own: ،), skipping empty ones. */
  const list = (items: (string | null | undefined)[]) => items.filter(Boolean).join(lang === 'ar' ? '، ' : ', ')
  return { t, term, city, num, date, list }
}
