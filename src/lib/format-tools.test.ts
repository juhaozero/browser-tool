import { describe, expect, it } from 'vitest'
import { formatMarkup, minifyMarkup, validateMarkup } from '@/lib/markup-format'
import { convertData, csvToJson, jsonToCsv } from '@/lib/data-convert'
import { convertAllRadix, parseRadixInput } from '@/lib/radix-convert'
import { diffJson, formatJsonDiff, summarizeJsonDiff } from '@/lib/json-diff'

describe('markup-format', () => {
  it('formats and validates yaml', () => {
    const out = formatMarkup('yaml', 'name: demo\nitems: [1, 2]')
    expect(out).toContain('name: demo')
    expect(validateMarkup('yaml', out).ok).toBe(true)
  })

  it('formats xml', () => {
    const out = formatMarkup('xml', '<root><a>1</a><b/></root>', 2)
    expect(out).toContain('<root>')
    expect(out).toContain('<a>1</a>')
    expect(minifyMarkup('xml', out)).toContain('<root>')
  })

  it('formats toml', () => {
    const out = formatMarkup('toml', 'name = "demo"\ncount = 3')
    expect(out).toContain('name')
    expect(out).toContain('demo')
  })

  it('rejects invalid yaml', () => {
    const result = validateMarkup('yaml', 'foo: [1, 2')
    expect(result.ok).toBe(false)
  })
})

describe('data-convert', () => {
  it('converts json to yaml and back', () => {
    const yaml = convertData('json-yaml', '{"a":1,"b":"x"}')
    expect(yaml).toContain('a: 1')
    const json = convertData('yaml-json', yaml)
    expect(JSON.parse(json)).toEqual({ a: 1, b: 'x' })
  })

  it('converts json to xml and back', () => {
    const xml = convertData('json-xml', '{"name":"demo","n":1}')
    expect(xml).toContain('<name>demo</name>')
    const json = JSON.parse(convertData('xml-json', xml))
    expect(json.root.name).toBe('demo')
  })

  it('converts object array csv roundtrip', () => {
    const csv = jsonToCsv([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
    expect(csv.split('\n')[0]).toBe('id,name')
    const rows = csvToJson(csv)
    expect(rows).toEqual([
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ])
  })

  it('handles quoted csv', () => {
    const rows = csvToJson('a,b\n"1,2","say ""hi"""')
    expect(rows[0]).toEqual({ a: '1,2', b: 'say "hi"' })
  })
})

describe('radix-convert', () => {
  it('converts decimal 255', () => {
    const all = convertAllRadix('255', 10)
    expect(all.bin).toBe('11111111')
    expect(all.oct).toBe('377')
    expect(all.hex).toBe('FF')
  })

  it('parses prefixes and separators', () => {
    expect(parseRadixInput('0xFF', 16)).toBe(255n)
    expect(parseRadixInput('1111_0000', 2)).toBe(0xf0n)
    expect(parseRadixInput('0o17', 8)).toBe(15n)
  })
})

describe('json-diff', () => {
  it('detects added removed changed', () => {
    const entries = diffJson(
      { a: 1, b: 2, c: { d: 3 } },
      { a: 1, b: 9, c: { d: 3 }, e: true },
    )
    const summary = summarizeJsonDiff(entries)
    expect(summary.changed).toBe(1)
    expect(summary.added).toBe(1)
    expect(summary.removed).toBe(0)
    expect(formatJsonDiff(entries)).toContain('$.b')
    expect(formatJsonDiff(entries)).toContain('$.e')
  })

  it('diffs arrays by index', () => {
    const entries = diffJson([1, 2], [1, 3, 4])
    expect(entries.some((e) => e.path === '$[1]' && e.kind === 'changed')).toBe(true)
    expect(entries.some((e) => e.path === '$[2]' && e.kind === 'added')).toBe(true)
  })
})
