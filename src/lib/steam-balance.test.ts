import { describe, expect, it } from 'vitest'
import {
  buyerPayFromReceive,
  formatDiscountZhe,
  hangKnifeRatio,
  maxPlatformCostForRatio,
  receiveFromBuyerPay,
  receiveNeededForRatio,
  roundMoney,
  steamFeeAmount,
} from '@/lib/steam-balance'

describe('steam-balance', () => {
  it('converts buyer pay and receive with 15% fee', () => {
    expect(receiveFromBuyerPay(115)).toBeCloseTo(100, 10)
    expect(buyerPayFromReceive(100)).toBeCloseTo(115, 10)
    expect(steamFeeAmount(115)).toBeCloseTo(15, 10)
  })

  it('computes hang-knife ratio', () => {
    expect(hangKnifeRatio(75, 100)).toBe(0.75)
    expect(formatDiscountZhe(0.75)).toBe('7.5 折')
  })

  it('plans from cost or receive', () => {
    expect(receiveNeededForRatio(75, 0.75)).toBeCloseTo(100, 10)
    expect(maxPlatformCostForRatio(100, 0.75)).toBeCloseTo(75, 10)
    expect(roundMoney(buyerPayFromReceive(100), 2)).toBe(115)
  })
})
