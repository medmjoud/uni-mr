import type { UIKey } from '@/i18n/ui'

export const SITE_NAME = 'UniMauritania'

/** Main navigation. Paths are locale-free; wrap them with localePath(). */
export const NAV: { path: string; label: UIKey }[] = [
  { path: '/#directory', label: 'nav.universities' },
  { path: '/#orientation', label: 'nav.orientation' },
  { path: '/admissions/', label: 'nav.admissions' },
  { path: '/scholarships/', label: 'nav.scholarships' },
  { path: '/study-abroad/', label: 'nav.abroad' },
  { path: '/compare/', label: 'nav.compare' },
  { path: '/about/', label: 'nav.about' },
]

/** Link for readers to report a correction. Swap for a form or inbox before launch. */
export const CORRECTIONS_URL = 'https://github.com/medmjoud/uni-mr/issues/new'
