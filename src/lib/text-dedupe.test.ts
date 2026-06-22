import { describe, expect, it } from 'vitest'
import { dedupeLines } from './text-dedupe'

describe('dedupeLines', () => {
  it('removes duplicate lines keeping first', () => {
    const result = dedupeLines('a\nb\na\nc\nb\n')
    expect(result.output).toBe('a\nb\nc')
    expect(result.removed).toBe(2)
    expect(result.unique).toBe(3)
  })

  it('keeps last occurrence', () => {
    const result = dedupeLines('a\nb\na\nc', { keep: 'last' })
    expect(result.output).toBe('b\na\nc')
  })

  it('ignores case when caseSensitive is false', () => {
    const result = dedupeLines('Foo\nfoo\nBAR', { caseSensitive: false })
    expect(result.output).toBe('Foo\nBAR')
    expect(result.removed).toBe(1)
  })

  it('skips empty lines when ignoreEmpty is true', () => {
    const result = dedupeLines('a\n\n\na', { ignoreEmpty: true })
    expect(result.output).toBe('a')
    expect(result.removed).toBe(1)
  })
})
