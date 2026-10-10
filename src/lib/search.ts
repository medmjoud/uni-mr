/** Fold accents (Latin) and short vowels/tatweel (Arabic) so searches match loosely. Shared by server and browser. */
export function normalizeSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ًͯ-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
}
