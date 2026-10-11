import type { UIKey } from '@/i18n/ui'

export const SITE_NAME = 'UniMauritania'

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

/** Link for readers to report a correction. Swap for a form or inbox before launch. */
export const CORRECTIONS_URL = 'https://github.com/medmjoud/uni-mr/issues/new'
