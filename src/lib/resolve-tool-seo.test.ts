import { describe, expect, it } from 'vitest'
import { resolveToolSeo } from '@/lib/resolve-tool-seo'

describe('resolveToolSeo', () => {
  it('uses enhanced copy for curated tools', () => {
    const seo = resolveToolSeo({
      id: 'base64',
      name: 'Base64 编解码',
      description: '文本与 Base64 互转，支持 Unicode 字符',
      tags: ['base64', 'encode', 'decode'],
    })
    expect(seo.title).toContain('Base64')
    expect(seo.description.length).toBeGreaterThan(40)
    expect(seo.intro.length).toBeGreaterThan(seo.description.length - 20)
    expect(seo.bullets.length).toBeGreaterThan(1)
    expect(seo.faqs.length).toBeGreaterThan(0)
  })

  it('falls back for tools without custom seo', () => {
    const seo = resolveToolSeo({
      id: 'some-unknown-tool',
      name: '示例工具',
      description: '这是一句短描述',
      tags: ['foo', 'bar'],
    })
    expect(seo.title).toBe('示例工具 — Browser Tool')
    expect(seo.description).toBe('这是一句短描述')
    expect(seo.intro).toBe('这是一句短描述')
    expect(seo.bullets[0]).toBe('支持 foo')
  })
})
