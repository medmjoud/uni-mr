// Downloads Mauritania's first-level administrative boundaries (wilayas) from
// geoBoundaries (https://www.geoboundaries.org, CC BY 4.0) and projects them into
// SVG path data for the hero map. Run with `pnpm geo`; the output is committed so
// regular builds never depend on this network call.
import { writeFile, mkdir } from 'node:fs/promises'

const API = 'https://www.geoboundaries.org/api/current/gbOpen/MRT/ADM1/'
const OUT = new URL('../src/data/geo/mauritania.json', import.meta.url)

// Equirectangular projection scaled by cos(mid-latitude) so the country keeps its shape.
const BOUNDS = { minLon: -17.2, maxLon: -4.7, minLat: 14.6, maxLat: 27.4 }
const WIDTH = 1000
const kx = Math.cos(((BOUNDS.minLat + BOUNDS.maxLat) / 2) * (Math.PI / 180))
const scale = WIDTH / ((BOUNDS.maxLon - BOUNDS.minLon) * kx)
const HEIGHT = Math.round((BOUNDS.maxLat - BOUNDS.minLat) * scale)

const project = ([lon, lat]) => [
  +((lon - BOUNDS.minLon) * kx * scale).toFixed(1),
  +((BOUNDS.maxLat - lat) * scale).toFixed(1),
]

function ringToPath(ring) {
  const points = ring.map(project)
  // Drop consecutive points that collapse onto the same pixel.
  const kept = points.filter(
    (p, i) => i === 0 || Math.abs(p[0] - points[i - 1][0]) + Math.abs(p[1] - points[i - 1][1]) >= 1.2,
  )
  return 'M' + kept.map((p) => p.join(',')).join('L') + 'Z'
}

function geometryToPath(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  return polygons.flatMap((poly) => poly.map(ringToPath)).join('')
}

const meta = await (await fetch(API)).json()
const geojson = await (await fetch(meta.simplifiedGeometryGeoJSON)).json()

const regions = geojson.features
  .map((f) => ({
    name: f.properties.shapeName,
    d: geometryToPath(f.geometry),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

await mkdir(new URL('.', OUT), { recursive: true })
await writeFile(
  OUT,
  JSON.stringify(
    {
      source: {
        title: `geoBoundaries ${meta.boundaryISO} ${meta.boundaryType} (${meta.boundaryYearRepresented})`,
        url: 'https://www.geoboundaries.org',
        license: 'CC BY 4.0',
      },
      projection: { ...BOUNDS, kx, scale },
      width: WIDTH,
      height: HEIGHT,
      regions,
    },
    null,
    2,
  ),
)
console.log(`Wrote ${regions.length} regions (${WIDTH}x${HEIGHT}) to ${OUT.pathname}`)
