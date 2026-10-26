import type { UIKey } from '@/i18n/ui'
import { localePath, type Locale } from '@/i18n'

/** The name in French, used where one fixed name is needed. Localised as 'site.name'. */
export const SITE_NAME = 'Universités de Mauritanie'

/** Cloudflare Web Analytics site token (cookie-less, so no consent banner). Public: it ships in every page. */
export const CF_ANALYTICS_TOKEN = '6ed43d34957a49fcb90ec8e43f7db523'

/** Every page, as listed in the footer. Paths are locale-free; wrap them with localePath(). */
export const NAV: { path: string; label: UIKey }[] = [
  { path: '/#directory', label: 'nav.universities' },
  { path: '/#orientation', label: 'nav.orientation' },
  { path: '/admissions/', label: 'nav.admissions' },
  { path: '/calendar/', label: 'nav.calendar' },
  { path: '/scholarships/', label: 'nav.scholarships' },
  { path: '/study-abroad/', label: 'nav.abroad' },
  { path: '/compare/', label: 'nav.compare' },
  { path: '/about/', label: 'nav.about' },
]

/** The shorter list in the header: home-page sections and the about page stay in the footer. */
export const HEADER_NAV = NAV.filter((item) => item.path !== '/#orientation' && item.path !== '/about/')

/** Link to the correction form, prefilled with the page the reader came from and what it is about. */
export function correctionHref(lang: Locale, page?: string, about?: string) {
  const params = new URLSearchParams()
  if (about) params.set('about', about)
  if (page) params.set('page', page)
  const query = params.toString()
  return localePath(lang, '/corrections/') + (query ? `?${query}` : '')
}
