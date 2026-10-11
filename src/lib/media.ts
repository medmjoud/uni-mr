import type { ImageMetadata } from 'astro'
import type { Locale } from '@/i18n'
import media from '@/data/media.json'

// Logos are square, pre-trimmed marks on white, one per institution id (see src/data/media.json for sources).
const logoFiles = import.meta.glob<{ default: ImageMetadata }>('/src/assets/logos/*.webp', { eager: true })
const photoFiles = import.meta.glob<{ default: ImageMetadata }>('/src/assets/photos/*', { eager: true })

const logos = media.logos as Record<string, string>
const photos = media.photos as Record<
  string,
  {
    file: string
    caption: Record<Locale, string>
    author: string
    license: string
    licenseUrl: string
    source: string
  }
>

export function logoFor(id: string) {
  const image = logoFiles[`/src/assets/logos/${id}.webp`]?.default
  return image ? { image, source: logos[id] } : null
}

export function photoFor(id: string, lang: Locale) {
  const photo = photos[id]
  const image = photo && photoFiles[`/src/assets/photos/${photo.file}`]?.default
  return photo && image ? { ...photo, image, caption: photo.caption[lang] } : null
}
