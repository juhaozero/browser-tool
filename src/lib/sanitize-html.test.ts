import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from './sanitize-html'

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    expect(sanitizeHtml('<p>ok</p><script>alert(1)</script>')).not.toContain('script')
  })

  it('removes meta refresh', () => {
    const html = '<meta http-equiv="refresh" content="0;url=https://evil.com"><p>hi</p>'
    expect(sanitizeHtml(html)).not.toContain('meta')
    expect(sanitizeHtml(html)).toContain('hi')
  })

  it('strips javascript: href', () => {
    const html = '<a href="javascript:alert(1)">click</a>'
    const out = sanitizeHtml(html)
    expect(out).not.toContain('javascript:')
    expect(out).toContain('click')
  })
})
