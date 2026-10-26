import type { APIRoute } from 'astro'
import sharp from 'sharp'
import { doorMarkSvg } from '@/lib/brand'

// Home-screen icon for iOS and Android. Square corners: the phone rounds them itself.
export const GET: APIRoute = async () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 100 100">${doorMarkSvg({ radius: 0 })}</svg>`
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } })
}
