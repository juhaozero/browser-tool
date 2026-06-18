import { describe, expect, it } from 'vitest'
import { getNextCronRuns, validateCron } from './cron-utils'

describe('validateCron', () => {
  it('accepts standard 5-field expression', () => {
    expect(validateCron('0 9 * * 1')).toBeNull()
  })

  it('rejects invalid field count', () => {
    expect(validateCron('0 9 *')).toMatch(/5 个字段/)
  })

  it('rejects invalid step', () => {
    expect(validateCron('*/0 * * * *')).toMatch(/步长无效/)
  })
})

describe('getNextCronRuns', () => {
  it('returns upcoming runs for daily schedule', () => {
    const result = getNextCronRuns('0 0 * * *', 3)
    expect(typeof result).not.toBe('string')
    if (typeof result === 'string') return
    expect(result.runs).toHaveLength(3)
    expect(result.runs[0].getMinutes()).toBe(0)
    expect(result.runs[0].getSeconds()).toBe(0)
  })
})
