import { describe, expect, it } from 'vitest'
import {
  applyDiscount,
  compareRegionPrices,
  convertToBase,
  fallbackRateToBase,
  formatPercent,
  invertQuote,
  ratesFromApiPayload,
  savingsVsRef,
} from '@/lib/steam-region-fx'

describe('steam-region-fx', () => {
  it('converts local price with rate and discount', () => {
    expect(convertToBase(9.99, 6.77)).toBeCloseTo(67.6323, 4)
    expect(applyDiscount(100, 0.75)).toBe(75)
  })

  it('inverts API quote to foreign→base rate', () => {
    expect(invertQuote(0.1477292, false)).toBeCloseTo(6.769, 2)
    expect(invertQuote(1, true)).toBe(1)
  })

  it('builds fallback cross rates via CNY', () => {
    expect(fallbackRateToBase('CNY', 'CNY')).toBe(1)
    expect(fallbackRateToBase('USD', 'CNY')).toBeCloseTo(6.77, 5)
    expect(fallbackRateToBase('USD', 'USD')).toBe(1)
    // 1 EUR in USD ≈ 7.72 / 6.77
    expect(fallbackRateToBase('EUR', 'USD')).toBeCloseTo(7.72 / 6.77, 5)
  })

  it('compares regions and sorts by effective cost', () => {
    const rows = compareRegionPrices([
      { regionId: 'cn', localPrice: 98, rateToBase: 1, discount: 1 },
      { regionId: 'us', localPrice: 9.99, rateToBase: 6.77, discount: 1 },
      { regionId: 'tr', localPrice: 200, rateToBase: 0.143, discount: 0.8 },
    ])
    expect(rows[0].regionId).toBe('tr')
    expect(rows[0].effective).toBeCloseTo(200 * 0.143 * 0.8, 6)
    expect(rows.map((r) => r.regionId)).toEqual(['tr', 'us', 'cn'])
  })

  it('computes savings vs reference region', () => {
    expect(savingsVsRef(70, 100)).toBeCloseTo(0.3, 10)
    expect(formatPercent(0.3)).toBe('+30.0%')
    expect(formatPercent(-0.1)).toBe('-10.0%')
    expect(savingsVsRef(50, 0)).toBeNull()
  })

  it('parses fawaz currency API payload', () => {
    const result = ratesFromApiPayload('CNY', {
      date: '2026-07-21',
      cny: { usd: 0.1477292, try: 6.97222313, cny: 1 },
    })
    expect(result.date).toBe('2026-07-21')
    expect(result.rates.CNY).toBe(1)
    expect(result.rates.USD).toBeCloseTo(6.769, 2)
    expect(result.rates.TRY).toBeCloseTo(0.1434, 3)
  })
})
