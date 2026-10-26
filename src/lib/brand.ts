// The doorway mark: a gold arched door on a green rounded square, drawn on a 100 × 100 grid.
export const BRAND_GREEN = '#173a28'
export const BRAND_GOLD = '#f2b544'

export const DOOR_PATH = 'M34 76 V50 C34 35 41 27 50 22 C59 27 66 35 66 50 V76 Z'
export const STEP_RECT = { x: 26, y: 76, width: 48, height: 6, rx: 3 }

/** The mark's inner SVG markup, without the outer <svg>, for build-time images. */
export function doorMarkSvg({ radius = 24 }: { radius?: number } = {}) {
  const s = STEP_RECT
  return `<rect width="100" height="100" rx="${radius}" fill="${BRAND_GREEN}"/><path d="${DOOR_PATH}" fill="${BRAND_GOLD}"/><rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.rx}" fill="${BRAND_GOLD}"/>`
}
