/**
 * Steam 区服价格汇率比价
 *
 * 将各区服本币标价换算到统一基准货币后排序。
 * 汇率定义为：1 单位区服货币 = rate 单位基准货币。
 * 可选「购卡折扣」：实际成本 = 换算价 × 折扣（如礼品卡七五折填 0.75）。
 */

export type SteamCurrencyCode =
  | 'CNY'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'HKD'
  | 'TWD'
  | 'JPY'
  | 'KRW'
  | 'RUB'
  | 'TRY'
  | 'ARS'
  | 'KZT'
  | 'UAH'
  | 'INR'
  | 'BRL'
  | 'PLN'
  | 'PHP'
  | 'THB'
  | 'MYR'
  | 'SGD'
  | 'VND'
  | 'IDR'
  | 'MXN'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'NOK'
  | 'SEK'
  | 'NZD'
  | 'CLP'
  | 'PEN'
  | 'ZAR'
  | 'AED'
  | 'SAR'
  | 'ILS'

export interface SteamRegionMeta {
  id: string
  /** 区服中文名 */
  name: string
  currency: SteamCurrencyCode
  /** 备注（如已改用 USD 标价） */
  note?: string
  /** 首页默认勾选 */
  defaultEnabled?: boolean
}

/**
 * 相对 CNY 的离线兜底汇率（1 外币 ≈ ? CNY），仅作无网时的初值，可被在线汇率覆盖。
 */
export const FALLBACK_RATE_TO_CNY: Record<SteamCurrencyCode, number> = {
  CNY: 1,
  USD: 6.77,
  EUR: 7.72,
  GBP: 9.09,
  HKD: 0.86,
  TWD: 0.21,
  JPY: 0.0417,
  KRW: 0.00459,
  RUB: 0.0862,
  TRY: 0.143,
  ARS: 0.00457,
  KZT: 0.0144,
  UAH: 0.151,
  INR: 0.0702,
  BRL: 1.33,
  PLN: 1.78,
  PHP: 0.11,
  THB: 0.201,
  MYR: 1.65,
  SGD: 5.24,
  VND: 0.000257,
  IDR: 0.000377,
  MXN: 0.389,
  CAD: 4.81,
  AUD: 4.74,
  CHF: 8.35,
  NOK: 0.7,
  SEK: 0.699,
  NZD: 3.97,
  CLP: 0.00724,
  PEN: 1.99,
  ZAR: 0.41,
  AED: 1.84,
  SAR: 1.81,
  ILS: 2.22,
}

/** 常用比价区服（按常见关注度排序） */
export const STEAM_REGIONS: SteamRegionMeta[] = [
  { id: 'cn', name: '中国', currency: 'CNY', defaultEnabled: true },
  { id: 'us', name: '美国', currency: 'USD', defaultEnabled: true },
  { id: 'eu', name: '欧元区', currency: 'EUR', defaultEnabled: true },
  { id: 'hk', name: '香港', currency: 'HKD', defaultEnabled: true },
  { id: 'tw', name: '台湾', currency: 'TWD', defaultEnabled: true },
  { id: 'jp', name: '日本', currency: 'JPY', defaultEnabled: true },
  { id: 'kr', name: '韩国', currency: 'KRW', defaultEnabled: false },
  { id: 'ru', name: '俄罗斯', currency: 'RUB', defaultEnabled: true },
  {
    id: 'tr',
    name: '土耳其',
    currency: 'TRY',
    note: '部分商品已改 USD 标价，请以商店实际币种为准',
    defaultEnabled: true,
  },
  {
    id: 'ar',
    name: '阿根廷',
    currency: 'ARS',
    note: '部分商品已改 USD 标价，请以商店实际币种为准',
    defaultEnabled: true,
  },
  { id: 'kz', name: '哈萨克斯坦', currency: 'KZT', defaultEnabled: true },
  { id: 'ua', name: '乌克兰', currency: 'UAH', defaultEnabled: false },
  { id: 'in', name: '印度', currency: 'INR', defaultEnabled: false },
  { id: 'br', name: '巴西', currency: 'BRL', defaultEnabled: false },
  { id: 'pl', name: '波兰', currency: 'PLN', defaultEnabled: false },
  { id: 'ph', name: '菲律宾', currency: 'PHP', defaultEnabled: false },
  { id: 'th', name: '泰国', currency: 'THB', defaultEnabled: false },
  { id: 'my', name: '马来西亚', currency: 'MYR', defaultEnabled: false },
  { id: 'sg', name: '新加坡', currency: 'SGD', defaultEnabled: false },
  { id: 'vn', name: '越南', currency: 'VND', defaultEnabled: false },
  { id: 'id', name: '印尼', currency: 'IDR', defaultEnabled: false },
  { id: 'mx', name: '墨西哥', currency: 'MXN', defaultEnabled: false },
  { id: 'ca', name: '加拿大', currency: 'CAD', defaultEnabled: false },
  { id: 'au', name: '澳大利亚', currency: 'AUD', defaultEnabled: false },
  { id: 'gb', name: '英国', currency: 'GBP', defaultEnabled: false },
]

export const BASE_CURRENCY_OPTIONS: { value: SteamCurrencyCode; label: string }[] = [
  { value: 'CNY', label: '人民币 CNY' },
  { value: 'USD', label: '美元 USD' },
  { value: 'EUR', label: '欧元 EUR' },
  { value: 'HKD', label: '港币 HKD' },
]

export interface RegionPriceInput {
  regionId: string
  localPrice: number
  /** 1 区服货币 = ? 基准货币 */
  rateToBase: number
  /** 购卡/充值折扣，1 = 无折扣，0.75 = 七五折 */
  discount: number
}

export interface RegionCompareRow {
  regionId: string
  name: string
  currency: SteamCurrencyCode
  localPrice: number
  rateToBase: number
  discount: number
  /** 按中间价换算 */
  converted: number
  /** 计入购卡折扣后的实际成本 */
  effective: number
  note?: string
}

export function roundMoney(n: number, digits = 2): number {
  if (!Number.isFinite(n)) return n
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/** 本币标价 × 汇率 → 基准货币金额 */
export function convertToBase(localPrice: number, rateToBase: number): number {
  assertNonNeg(localPrice, '本币价格')
  assertPositive(rateToBase, '汇率')
  return localPrice * rateToBase
}

/** 换算价 × 折扣 → 实际购入成本 */
export function applyDiscount(converted: number, discount: number): number {
  assertNonNeg(converted, '换算价')
  if (!Number.isFinite(discount) || discount <= 0 || discount > 1) {
    throw new Error('购卡折扣须在 (0, 1] 之间（例如 0.75 表示七五折）')
  }
  return converted * discount
}

/**
 * 将「1 基准货币 = quote 外币」的报价转为「1 外币 = ? 基准货币」。
 * 若外币即基准货币，返回 1。
 */
export function invertQuote(quotePerBase: number, isSameCurrency: boolean): number {
  if (isSameCurrency) return 1
  if (!Number.isFinite(quotePerBase) || quotePerBase <= 0) {
    throw new Error('无效的汇率报价')
  }
  return 1 / quotePerBase
}

/** 离线兜底：任意基准货币下，1 区服货币 ≈ ? 基准 */
export function fallbackRateToBase(
  currency: SteamCurrencyCode,
  base: SteamCurrencyCode,
): number {
  const toCny = FALLBACK_RATE_TO_CNY[currency]
  const baseToCny = FALLBACK_RATE_TO_CNY[base]
  if (!toCny || !baseToCny) throw new Error('未知货币')
  return toCny / baseToCny
}

export function compareRegionPrices(inputs: RegionPriceInput[]): RegionCompareRow[] {
  const byId = new Map(STEAM_REGIONS.map((r) => [r.id, r]))
  const rows: RegionCompareRow[] = []

  for (const input of inputs) {
    const meta = byId.get(input.regionId)
    if (!meta) throw new Error(`未知区服: ${input.regionId}`)
    const converted = convertToBase(input.localPrice, input.rateToBase)
    const effective = applyDiscount(converted, input.discount)
    rows.push({
      regionId: input.regionId,
      name: meta.name,
      currency: meta.currency,
      localPrice: input.localPrice,
      rateToBase: input.rateToBase,
      discount: input.discount,
      converted,
      effective,
      note: meta.note,
    })
  }

  return rows.sort((a, b) => a.effective - b.effective || a.converted - b.converted)
}

/** 相对参照区（通常为中国）的节省比例：(ref - self) / ref */
export function savingsVsRef(selfEffective: number, refEffective: number): number | null {
  if (!Number.isFinite(selfEffective) || !Number.isFinite(refEffective) || refEffective <= 0) {
    return null
  }
  return (refEffective - selfEffective) / refEffective
}

export function formatPercent(ratio: number, digits = 1): string {
  const pct = roundMoney(ratio * 100, digits)
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(digits)}%`
}

export function formatMoney(n: number, digits = 2): string {
  return roundMoney(n, digits).toFixed(digits)
}

/** 在线汇率 API（jsDelivr 镜像，CORS 友好） */
export const FX_API_BASE =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies'

export const FX_API_FALLBACK_BASE =
  'https://latest.currency-api.pages.dev/v1/currencies'

export interface FxFetchResult {
  date: string
  /** currency → 1 该货币 = ? 基准货币 */
  rates: Partial<Record<SteamCurrencyCode, number>>
}

type FxApiPayload = {
  date?: string
  [base: string]: string | Record<string, number> | undefined
}

/**
 * 拉取相对基准货币的汇率表。
 * API 返回值为「1 基准 = ? 外币」，需取倒数得到「1 外币 = ? 基准」。
 */
export function ratesFromApiPayload(base: SteamCurrencyCode, payload: FxApiPayload): FxFetchResult {
  const key = base.toLowerCase()
  const quotes = payload[key]
  if (!quotes || typeof quotes !== 'object') {
    throw new Error('汇率接口返回格式异常')
  }

  const rates: Partial<Record<SteamCurrencyCode, number>> = {}
  for (const code of Object.keys(FALLBACK_RATE_TO_CNY) as SteamCurrencyCode[]) {
    if (code === base) {
      rates[code] = 1
      continue
    }
    const quote = quotes[code.toLowerCase()]
    if (typeof quote === 'number' && quote > 0) {
      rates[code] = invertQuote(quote, false)
    }
  }

  return {
    date: typeof payload.date === 'string' ? payload.date : '',
    rates,
  }
}

function assertNonNeg(n: number, label: string): void {
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label}须为非负数字`)
}

function assertPositive(n: number, label: string): void {
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${label}须为正数`)
}
