// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Production domain; SITE_URL overrides it for preview deploys.
  site: process.env.SITE_URL ?? 'https://universitesmauritanie.com',
  integrations: [
    sitemap({
      // The thank-you page after a correction is not worth indexing.
      filter: (page) => !page.includes('/corrections/sent/'),
      i18n: {
        defaultLocale: 'fr',
        locales: { fr: 'fr-MR', ar: 'ar-MR', en: 'en' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      // One family for every script: Readex Pro extends Lexend's friendly, highly legible
      // geometry to Arabic, so French, Arabic and English read as one voice.
      provider: fontProviders.google(),
      name: 'Readex Pro',
      cssVariable: '--font-readex',
      weights: ['300 700'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext', 'arabic'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
})
