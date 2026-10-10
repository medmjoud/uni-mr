// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Set SITE_URL in the deploy environment once the production domain is known.
  site: process.env.SITE_URL ?? 'https://uni-mr.fiche.workers.dev',
  integrations: [
    sitemap({
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
