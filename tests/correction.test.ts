import { describe, expect, it } from 'vitest'
import { buildCorrectionEmail, parseCorrection, type Correction } from '../worker/correction'

const form = (fields: Record<string, string>) => {
  const data = new FormData()
  for (const [k, v] of Object.entries(fields)) data.set(k, v)
  return data
}

const decodeBody = (raw: string) => {
  const body = raw.split('\r\n\r\n')[1].replace(/\r\n/g, '')
  return new TextDecoder().decode(Uint8Array.from(atob(body), (c) => c.charCodeAt(0)))
}

describe('parseCorrection', () => {
  it('accepts a complete report', () => {
    const result = parseCorrection(
      form({ lang: 'ar', about: 'ISCAE', page: '/ar/universities/iscae/', message: 'The website moved to iscae.mr', email: 'a@b.mr' }),
    )
    expect(result).toMatchObject({ kind: 'ok', correction: { lang: 'ar', about: 'ISCAE', page: '/ar/universities/iscae/' } })
  })

  it('treats a filled honeypot as spam', () => {
    expect(parseCorrection(form({ website: 'http://spam', message: 'Buy something now please' })).kind).toBe('spam')
  })

  it('rejects a message that is too short, keeping what the report was about', () => {
    expect(parseCorrection(form({ lang: 'en', about: 'UNA', page: '/en/', message: 'wrong' }))).toEqual({
      kind: 'invalid',
      lang: 'en',
      about: 'UNA',
      page: '/en/',
    })
  })

  it('rejects a malformed email', () => {
    expect(parseCorrection(form({ message: 'The phone number is wrong', email: 'not an email' })).kind).toBe('invalid')
  })

  it('drops pages that are not paths on this site', () => {
    for (const page of ['https://evil.example/', '//evil.example/', 'javascript:alert(1)']) {
      const result = parseCorrection(form({ message: 'The phone number is wrong', page }))
      expect(result.kind === 'ok' && result.correction.page).toBe('')
    }
  })

  it('falls back to French for an unknown language', () => {
    const result = parseCorrection(form({ lang: 'de', message: 'The phone number is wrong' }))
    expect(result.kind === 'ok' && result.correction.lang).toBe('fr')
  })
})

describe('buildCorrectionEmail', () => {
  const correction: Correction = {
    lang: 'ar',
    about: 'جامعة نواكشوط',
    page: '/ar/universities/universite-de-nouakchott/',
    message: 'رقم الهاتف تغيّر',
    source: '',
    email: 'student@example.com',
  }
  const raw = buildCorrectionEmail(correction, {
    from: 'corrections@universitesmauritanie.com',
    to: 'inbox@example.com',
    origin: 'https://universitesmauritanie.com',
    id: 'abc',
    date: new Date('2026-10-26T00:00:00Z'),
  })

  it('sets the reply address and encodes non-ASCII headers', () => {
    expect(raw).toContain('Reply-To: <student@example.com>')
    expect(raw).toMatch(/^Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/m)
    expect(raw).toContain('Message-ID: <abc@universitesmauritanie.com>')
  })

  it('keeps Arabic text intact in the body', () => {
    const body = decodeBody(raw)
    expect(body).toContain('رقم الهاتف تغيّر')
    expect(body).toContain('Page: https://universitesmauritanie.com/ar/universities/universite-de-nouakchott/')
  })

  it('leaves out Reply-To when no email was given', () => {
    const anonymous = buildCorrectionEmail({ ...correction, email: '' }, {
      from: 'corrections@universitesmauritanie.com',
      to: 'inbox@example.com',
      origin: 'https://universitesmauritanie.com',
      id: 'abc',
      date: new Date(),
    })
    expect(anonymous).not.toContain('Reply-To')
  })
})
