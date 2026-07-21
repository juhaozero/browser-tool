/**
 * Steam 市场手续费与倒余额（挂刀）比例计算
 *
 * Steam 市场手续费默认 15%（Valve 5% + 游戏 10%），按「卖家到手」计：
 *   买家支付 = 卖家到手 × (1 + feeRate)
 *   卖家到手 = 买家支付 ÷ (1 + feeRate)
 *
 * 倒余额比例（越低越划算）：
 *   比例 = 第三方平台买入价 ÷ Steam 卖家到手余额
 *   例如 0.75 表示七五折
 */

export const DEFAULT_STEAM_FEE_RATE = 0.15

export type Money = number

function assertFinitePositive(n: number, label: string): void {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${label}须为非负数字`)
  }
}

function assertFeeRate(feeRate: number): void {
  if (!Number.isFinite(feeRate) || feeRate < 0 || feeRate >= 1) {
    throw new Error('手续费率须在 0–1 之间（例如 0.15 表示 15%）')
  }
}

/** 由卖家到手反推买家支付（挂牌价） */
export function buyerPayFromReceive(receive: Money, feeRate = DEFAULT_STEAM_FEE_RATE): Money {
  assertFinitePositive(receive, '到手金额')
  assertFeeRate(feeRate)
  return receive * (1 + feeRate)
}

/** 由买家支付（挂牌价）反推卖家到手 */
export function receiveFromBuyerPay(buyerPay: Money, feeRate = DEFAULT_STEAM_FEE_RATE): Money {
  assertFinitePositive(buyerPay, '挂牌价')
  assertFeeRate(feeRate)
  return buyerPay / (1 + feeRate)
}

/** 手续费金额（买家支付 − 卖家到手） */
export function steamFeeAmount(buyerPay: Money, feeRate = DEFAULT_STEAM_FEE_RATE): Money {
  const receive = receiveFromBuyerPay(buyerPay, feeRate)
  return buyerPay - receive
}

/**
 * 倒余额 / 挂刀比例
 * @param platformCost 第三方平台实付（人民币等）
 * @param steamReceive Steam 市场卖家到手余额
 */
export function hangKnifeRatio(platformCost: Money, steamReceive: Money): number {
  assertFinitePositive(platformCost, '平台买入价')
  assertFinitePositive(steamReceive, 'Steam 到手')
  if (steamReceive === 0) throw new Error('Steam 到手不能为 0')
  return platformCost / steamReceive
}

/** 比例转「几折」文案，如 0.75 → 「7.5 折」 */
export function formatDiscountZhe(ratio: number, digits = 2): string {
  if (!Number.isFinite(ratio) || ratio < 0) return '—'
  const zhe = ratio * 10
  const text = Number.isInteger(zhe) ? String(zhe) : zhe.toFixed(digits).replace(/\.?0+$/, '')
  return `${text} 折`
}

/** 比例转百分比文案，如 0.75 → 「75%」 */
export function formatRatioPercent(ratio: number, digits = 2): string {
  if (!Number.isFinite(ratio) || ratio < 0) return '—'
  return `${(ratio * 100).toFixed(digits).replace(/\.?0+$/, '')}%`
}

/** 已知平台买入价与目标比例 → 需要到手的 Steam 余额 */
export function receiveNeededForRatio(platformCost: Money, ratio: number): Money {
  assertFinitePositive(platformCost, '平台买入价')
  if (!Number.isFinite(ratio) || ratio <= 0) throw new Error('目标比例须为正数')
  return platformCost / ratio
}

/** 已知目标到手与目标比例 → 平台最多可花多少 */
export function maxPlatformCostForRatio(steamReceive: Money, ratio: number): Money {
  assertFinitePositive(steamReceive, 'Steam 到手')
  if (!Number.isFinite(ratio) || ratio <= 0) throw new Error('目标比例须为正数')
  return steamReceive * ratio
}

export function roundMoney(n: number, digits = 2): number {
  const f = 10 ** digits
  return Math.round((n + Number.EPSILON) * f) / f
}
