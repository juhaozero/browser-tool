import { describe, expect, it } from 'vitest'
import { formatSql, minifySql } from '@/lib/sql-format'
import { parseUrl, buildUrl } from '@/lib/url-parse'
import { generateNanoId, generateUlid, Hashids } from '@/lib/id-generators'
import { escapeText, unescapeText } from '@/lib/unicode-escape'
import { formatCss, minifyCss } from '@/lib/code-format'
import { parsePem } from '@/lib/pem-parse'
import { signJwt, verifyJwt } from '@/lib/jwt-sign'

describe('sql-format', () => {
  it('formats select with clauses', () => {
    const out = formatSql('select id,name from users where active=1 order by id')
    expect(out).toContain('SELECT')
    expect(out).toContain('FROM')
    expect(out).toContain('WHERE')
  })

  it('minifies sql', () => {
    expect(minifySql('SELECT  *\nFROM users')).toMatch(/SELECT \* FROM users/i)
  })
})

describe('url-parse', () => {
  it('parses query and hash', () => {
    const p = parseUrl('https://example.com/a?b=1&c=你好#x')
    expect(p.hostname).toBe('example.com')
    expect(p.query).toEqual([
      { key: 'b', value: '1' },
      { key: 'c', value: '你好' },
    ])
    expect(p.hash).toBe('#x')
  })

  it('rebuilds url', () => {
    const href = buildUrl({
      protocol: 'https:',
      hostname: 'example.com',
      pathname: '/path',
      query: [{ key: 'q', value: '1' }],
      hash: '#top',
    })
    expect(href).toContain('https://example.com/path')
    expect(href).toContain('q=1')
    expect(href).toContain('#top')
  })
})

describe('id-generators', () => {
  it('generates nanoid and ulid', () => {
    expect(generateNanoId(10)).toHaveLength(10)
    expect(generateUlid()).toHaveLength(26)
  })

  it('encodes and decodes hashids', () => {
    const h = new Hashids('salt', 6)
    const encoded = h.encode(1, 2, 3)
    expect(encoded.length).toBeGreaterThanOrEqual(6)
    expect(h.decode(encoded)).toEqual([1, 2, 3])
  })
})

describe('unicode-escape', () => {
  it('escapes and unescapes unicode', () => {
    const escaped = escapeText('你', 'unicode')
    expect(escaped).toBe('\\u4f60')
    expect(unescapeText(escaped, 'unicode')).toBe('你')
  })
})

describe('code-format', () => {
  it('formats and minifies css', () => {
    const formatted = formatCss('.a{color:red}')
    expect(formatted).toContain('{')
    expect(minifyCss(formatted)).toContain('.a{color:red}')
  })
})

describe('pem-parse', () => {
  it('parses pem blocks', () => {
    const blocks = parsePem(`-----BEGIN PUBLIC KEY-----\naGVsbG8=\n-----END PUBLIC KEY-----`)
    expect(blocks).toHaveLength(1)
    expect(blocks[0]!.label).toBe('PUBLIC KEY')
    expect(new TextDecoder().decode(blocks[0]!.der)).toBe('hello')
  })
})

describe('jwt verify', () => {
  it('verifies signed token', async () => {
    const token = await signJwt({ alg: 'HS256', typ: 'JWT' }, { sub: '1', name: 't' }, 'secret')
    const result = await verifyJwt(token, 'secret')
    expect(result.valid).toBe(true)
    expect(result.payload.sub).toBe('1')
  })

  it('rejects wrong secret', async () => {
    const token = await signJwt({ alg: 'HS256', typ: 'JWT' }, { sub: '1' }, 'secret')
    const result = await verifyJwt(token, 'wrong')
    expect(result.valid).toBe(false)
  })
})
