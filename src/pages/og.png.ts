import type { APIRoute } from 'astro'
import sharp from 'sharp'
import geo from '@/data/geo/mauritania.json'
import { doorMarkSvg } from '@/lib/brand'

// Social preview image, rendered at build time from the same boundary data as the hero map.
export const GET: APIRoute = async () => {
  const mapHeight = 560
  const mapScale = mapHeight / geo.height
  const mapWidth = geo.width * mapScale

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dcefe2"/><stop offset="1" stop-color="#c7e4d0"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#f1f8f3"/>
  <rect x="640" width="560" height="630" fill="url(#panel)"/>
  <g transform="translate(${640 + (560 - mapWidth) / 2} 30) scale(${mapScale})">
    ${geo.regions.map((r) => `<path d="${r.d}" fill="#ffffff" fill-opacity="0.8" stroke="#8cc29c" stroke-width="2.4"/>`).join('')}
  </g>
  <svg x="72" y="72" width="84" height="84" viewBox="0 0 100 100">${doorMarkSvg()}</svg>
  <text font-family="Helvetica, Arial, sans-serif" font-size="66" font-weight="700" fill="#173a28" letter-spacing="-1.5">
    <tspan x="72" y="290">Universités</tspan>
    <tspan x="72" y="370">de Mauritanie</tspan>
  </text>
  <text x="72" y="448" font-family="Geeza Pro, Arial, sans-serif" font-size="40" font-weight="700" fill="#2f7a45">جامعات موريتانيا</text>
  <text x="72" y="530" font-family="Helvetica, Arial, sans-serif" font-size="25" fill="#5f6d65">Universités, bourses et études à l’étranger</text>
</svg>`

  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } })
}
