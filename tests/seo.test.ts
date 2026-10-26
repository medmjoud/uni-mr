import { describe, expect, it } from 'vitest'
import { clipDescription, DESCRIPTION_MAX } from '../src/lib/seo'

describe('clipDescription', () => {
  it('keeps short descriptions as they are', () => {
    expect(clipDescription('  Universités   de Mauritanie ')).toBe('Universités de Mauritanie')
  })

  it('ends long descriptions on a whole word', () => {
    const text = "L'Université de Nouakchott est la principale université publique de Mauritanie et, de loin, le plus grand établissement d'enseignement supérieur du pays."
    const clipped = clipDescription(text, 60)
    expect(clipped).toBe("L'Université de Nouakchott est la principale université…")
    expect(clipped.length).toBeLessThanOrEqual(60)
  })

  it('drops trailing punctuation before the ellipsis', () => {
    expect(clipDescription('Public, Université, Nouakchott, Mauritanie', 32)).toBe('Public, Université, Nouakchott…')
  })

  it('clips Arabic on a word boundary too', () => {
    const text = 'جامعة نواكشوط هي الجامعة العمومية الرئيسية في موريتانيا وأكبر مؤسسة للتعليم العالي في البلاد بفارق كبير'
    const clipped = clipDescription(text, 40)
    expect(clipped.endsWith('…')).toBe(true)
    expect(text.startsWith(clipped.slice(0, -1))).toBe(true)
    expect(text[clipped.length - 1]).toBe(' ')
  })

  it('never goes over the limit', () => {
    expect(clipDescription('x'.repeat(400)).length).toBe(DESCRIPTION_MAX)
  })
})
