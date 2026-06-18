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

  it('strips data:application/javascript href', () => {
    const html = '<a href="data:application/javascript,alert(1)">click</a>'
    const out = sanitizeHtml(html)
    expect(out.toLowerCase()).not.toContain('javascript')
    expect(out).toContain('click')
  })

  it('strips data:image/svg+xml src', () => {
    const svg = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    const out = sanitizeHtml(`<img src="${svg}" alt="x">`)
    expect(out.toLowerCase()).not.toContain('data:')
    expect(out).toContain('alt="x"')
  })

  it('strips javascript in srcset', () => {
    const out = sanitizeHtml('<img srcset="javascript:alert(1) 1x">')
    expect(out.toLowerCase()).not.toContain('javascript')
  })

  it('strips javascript in style url()', () => {
    const out = sanitizeHtml('<div style="background:url(javascript:alert(1))">x</div>')
    expect(out.toLowerCase()).not.toContain('javascript')
    expect(out).toContain('x')
  })

  it('strips blob: href', () => {
    const out = sanitizeHtml('<a href="blob:https://evil.com/uuid">x</a>')
    expect(out.toLowerCase()).not.toContain('blob:')
    expect(out).toContain('x')
  })

  it('strips -moz-binding in style', () => {
    const out = sanitizeHtml('<div style="-moz-binding:url(x)">x</div>')
    expect(out.toLowerCase()).not.toContain('binding')
    expect(out).toContain('x')
  })

  it('allows safe inline style', () => {
    const out = sanitizeHtml('<p style="color:red;font-weight:bold">ok</p>')
    expect(out).toContain('color:red')
    expect(out).toContain('ok')
  })
})
