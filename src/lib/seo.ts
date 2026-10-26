/** Google shows about this many characters of a description before cutting it off. */
export const DESCRIPTION_MAX = 155

/** Shortens a meta description to fit search results, ending at a whole word with an ellipsis. */
export function clipDescription(text: string, max = DESCRIPTION_MAX) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  // Only fall back to a mid-word cut when a single word fills most of the space.
  const words = space > max * 0.6 ? cut.slice(0, space) : cut
  return `${words.replace(/[\s,;:.،؛–—-]+$/u, '')}…`
}
