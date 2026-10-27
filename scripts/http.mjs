// Shared by the scripts that visit school and ministry websites.

// Some school and ministry sites turn away anything that doesn't look like a browser.
export const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr,ar;q=0.9,en;q=0.8',
}

export const TIMEOUT_MS = 20_000

/** Run `fn` over `items` with at most `limit` running at once, keeping the order of results. */
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index])
    }
  }
  await Promise.all(Array.from({ length: limit }, worker))
  return results
}
