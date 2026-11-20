import { describe, expect, it } from 'vitest'
import { computeTextDiff, diffChars } from '@/lib/text-diff'

describe('diffChars', () => {
  it('highlights only the changed characters', () => {
    const parts = diffChars('PHYSICALDRIVE0', 'PHYSICALDRIVE1')
    expect(parts).toEqual([
      { text: 'PHYSICALDRIVE', kind: 'equal' },
      { text: '0', kind: 'delete' },
      { text: '1', kind: 'insert' },
    ])
  })

  it('marks inserted suffix', () => {
    const parts = diffChars('第二行', '第二行（已修改）')
    expect(parts[0]).toEqual({ text: '第二行', kind: 'equal' })
    expect(parts.some((p) => p.kind === 'insert')).toBe(true)
  })
})

describe('computeTextDiff', () => {
  it('marks line change with inline parts', () => {
    const result = computeTextDiff(
      '第一行\n第二行\n第三行',
      '第一行\n第二行（已修改）\n第三行\n第四行',
    )
    expect(result.stats.equal).toBe(2)
    expect(result.stats.changed).toBe(1)
    expect(result.stats.added).toBe(1)
    const change = result.rows.find((r) => r.kind === 'change')
    expect(change?.kind).toBe('change')
    if (change?.kind === 'change') {
      expect(change.leftParts.some((p) => p.kind === 'equal')).toBe(true)
      expect(change.rightParts.some((p) => p.kind === 'insert')).toBe(true)
    }
  })

  it('reports identical texts', () => {
    const result = computeTextDiff('same\nline', 'same\nline')
    expect(result.stats).toEqual({ added: 0, removed: 0, changed: 0, equal: 2 })
  })
})
