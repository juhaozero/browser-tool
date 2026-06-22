import { describe, expect, it } from 'vitest'
import {
  buildBadgeHtml,
  buildBadgeMarkdown,
  buildShieldsBadgeUrl,
  shieldsEncode,
  validateBadgeOptions,
} from './github-badge'

describe('shieldsEncode', () => {
  it('encodes spaces and dashes', () => {
    expect(shieldsEncode('build status')).toBe('build_status')
    expect(shieldsEncode('v1.0.0')).toBe('v1.0.0')
  })
})

describe('buildShieldsBadgeUrl', () => {
  it('builds shields.io badge url', () => {
    const url = buildShieldsBadgeUrl({
      label: 'build',
      message: 'passing',
      color: 'brightgreen',
    })
    expect(url).toBe('https://img.shields.io/badge/build-passing-brightgreen')
  })

  it('rejects javascript link', () => {
    const err = validateBadgeOptions({
      label: 'x',
      message: 'y',
      color: 'blue',
      link: 'javascript:alert(1)',
    })
    expect(err).toMatch(/http/)
  })

  it('rejects empty label', () => {
    expect(
      validateBadgeOptions({ label: '', message: 'ok', color: 'green' }),
    ).toMatch(/标签/)
  })
})

describe('buildBadgeMarkdown', () => {
  it('wraps with link when valid', () => {
    const url = 'https://img.shields.io/badge/build-passing-brightgreen'
    const md = buildBadgeMarkdown(url, {
      label: 'build',
      message: 'passing',
      color: 'brightgreen',
      link: 'https://github.com',
    })
    expect(md).toBe('[![build passing](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)')
  })
})

describe('buildBadgeHtml', () => {
  it('escapes alt text', () => {
    const url = 'https://img.shields.io/badge/x-y-blue'
    const html = buildBadgeHtml(url, {
      label: 'a<b',
      message: 'c',
      color: 'blue',
    })
    expect(html).toContain('alt="a&lt;b c"')
    expect(html).not.toContain('<b')
  })
})
