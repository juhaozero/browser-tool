import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, Select, ToolPanel, ToolSection } from '@/components/ui'
import { httpFetch } from '@/lib/http-client'
import {
  BASE_CURRENCY_OPTIONS,
  FX_API_BASE,
  FX_API_FALLBACK_BASE,
  STEAM_REGIONS,
  type RegionCompareRow,
  type SteamCurrencyCode,
  type SteamRegionMeta,
  compareRegionPrices,
  fallbackRateToBase,
  formatMoney,
  formatPercent,
  ratesFromApiPayload,
  roundMoney,
  savingsVsRef,
} from '@/lib/steam-region-fx'

type RegionRowState = {
  enabled: boolean
  price: string
  rate: string
  discount: string
}

type CompareResult =
  | { error: string; rows?: undefined; cn?: undefined; cheapest?: undefined; copy?: undefined }
  | {
      error: ''
      rows: RegionCompareRow[]
      cn: RegionCompareRow | undefined
      cheapest: RegionCompareRow
      copy: string
    }

function emptyRows(base: SteamCurrencyCode): Record<string, RegionRowState> {
  const next: Record<string, RegionRowState> = {}
  for (const region of STEAM_REGIONS) {
    next[region.id] = {
      enabled: Boolean(region.defaultEnabled),
      price: '',
      rate: formatMoney(fallbackRateToBase(region.currency, base), 6).replace(/\.?0+$/, '') || '1',
      discount: '1',
    }
  }
  return next
}

function parsePositive(raw: string, label: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: `请填写${label}` }
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return { ok: false, error: `${label}须为非负数字` }
  return { ok: true, value: n }
}

function parseDiscount(raw: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim() || '1'
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0 || n > 1) {
    return { ok: false, error: '购卡折扣须在 (0, 1]（1=无折扣，0.75=七五折）' }
  }
  return { ok: true, value: n }
}

function rateLabel(currency: SteamCurrencyCode, base: SteamCurrencyCode): string {
  return `1 ${currency} → ${base}`
}

async function fetchFxRates(base: SteamCurrencyCode) {
  const path = `${base.toLowerCase()}.json`
  const urls = [`${FX_API_BASE}/${path}`, `${FX_API_FALLBACK_BASE}/${path}`]
  let lastError: Error | null = null
  for (const url of urls) {
    try {
      const res = await httpFetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload = (await res.json()) as Parameters<typeof ratesFromApiPayload>[1]
      return ratesFromApiPayload(base, payload)
    } catch (e) {
      lastError = e instanceof Error ? e : new Error('拉取汇率失败')
    }
  }
  throw lastError ?? new Error('拉取汇率失败')
}

function buildCompareResult(
  rows: Record<string, RegionRowState>,
  base: SteamCurrencyCode,
): CompareResult {
  const inputs: {
    regionId: string
    localPrice: number
    rateToBase: number
    discount: number
  }[] = []

  for (const region of STEAM_REGIONS) {
    const row = rows[region.id]
    if (!row?.enabled) continue
    if (!row.price.trim()) continue

    const price = parsePositive(row.price, `${region.name}价格`)
    if (!price.ok) return { error: price.error }

    const rate = parsePositive(row.rate, `${region.name}汇率`)
    if (!rate.ok) return { error: rate.error }
    if (rate.value <= 0) return { error: `${region.name}汇率须为正数` }

    const discount = parseDiscount(row.discount)
    if (!discount.ok) return { error: `${region.name}：${discount.error}` }

    inputs.push({
      regionId: region.id,
      localPrice: price.value,
      rateToBase: rate.value,
      discount: discount.value,
    })
  }

  if (inputs.length === 0) {
    return { error: '请至少勾选一个区服并填写本币价格' }
  }

  try {
    const compared = compareRegionPrices(inputs)
    const cn = compared.find((r) => r.regionId === 'cn')
    const cheapest = compared[0]
    const copyLines = compared.map((r, i) => {
      const vs = cn ? savingsVsRef(r.effective, cn.effective) : null
      const vsText = vs == null ? '' : `，相对国区 ${formatPercent(vs)}`
      return `${i + 1}. ${r.name} ${formatMoney(r.localPrice)} ${r.currency} → ${formatMoney(r.effective)} ${base}${vsText}`
    })
    return {
      error: '',
      rows: compared,
      cn,
      cheapest,
      copy: copyLines.join('\n'),
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : '计算失败' }
  }
}

export default function SteamRegionFx() {
  const [base, setBase] = useState<SteamCurrencyCode>('CNY')
  const [rows, setRows] = useState<Record<string, RegionRowState>>(() => emptyRows('CNY'))
  const [fxDate, setFxDate] = useState('')
  const [fxLoading, setFxLoading] = useState(false)
  const [fxError, setFxError] = useState('')
  const [showAll, setShowAll] = useState(false)

  const visibleRegions = showAll
    ? STEAM_REGIONS
    : STEAM_REGIONS.filter((r) => rows[r.id]?.enabled || r.defaultEnabled)
  const result = buildCompareResult(rows, base)

  const updateRow = (id: string, patch: Partial<RegionRowState>) => {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const changeBase = (next: SteamCurrencyCode) => {
    setBase(next)
    setFxDate('')
    setFxError('')
    setRows((prev) => {
      const out: Record<string, RegionRowState> = {}
      for (const region of STEAM_REGIONS) {
        const old = prev[region.id]
        out[region.id] = {
          ...old,
          rate: formatMoney(fallbackRateToBase(region.currency, next), 6).replace(/\.?0+$/, '') || '1',
        }
      }
      return out
    })
  }

  const loadLiveRates = async () => {
    setFxLoading(true)
    setFxError('')
    try {
      const fx = await fetchFxRates(base)
      setFxDate(fx.date)
      setRows((prev) => {
        const out: Record<string, RegionRowState> = { ...prev }
        for (const region of STEAM_REGIONS) {
          const rate = fx.rates[region.currency]
          if (rate == null) continue
          out[region.id] = {
            ...out[region.id],
            rate: String(roundMoney(rate, 6)),
          }
        }
        return out
      })
    } catch (e) {
      setFxError(e instanceof Error ? e.message : '拉取汇率失败')
    } finally {
      setFxLoading(false)
    }
  }

  const loadExample = () => {
    setBase('CNY')
    setFxDate('')
    setFxError('')
    setShowAll(false)
    const next = emptyRows('CNY')
    const samples: Record<string, { price: string; discount?: string }> = {
      cn: { price: '98' },
      us: { price: '14.99' },
      eu: { price: '14.99' },
      hk: { price: '108' },
      tw: { price: '418' },
      jp: { price: '1850' },
      ru: { price: '649' },
      tr: { price: '280', discount: '0.85' },
      ar: { price: '8999', discount: '0.8' },
      kz: { price: '4990' },
    }
    for (const [id, sample] of Object.entries(samples)) {
      next[id] = {
        ...next[id],
        enabled: true,
        price: sample.price,
        discount: sample.discount ?? '1',
      }
    }
    for (const region of STEAM_REGIONS) {
      if (!samples[region.id]) next[region.id] = { ...next[region.id], enabled: false, price: '' }
    }
    setRows(next)
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <ExampleButton onClick={loadExample} />
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">换算基准</label>
          <Select
            value={base}
            onChange={(v) => changeBase(v as SteamCurrencyCode)}
            options={BASE_CURRENCY_OPTIONS}
          />
        </div>
        <Button onClick={loadLiveRates} disabled={fxLoading} variant="primary">
          {fxLoading ? '拉取中…' : '拉取实时汇率'}
        </Button>
        <Button onClick={() => setShowAll((v) => !v)} variant="ghost">
          {showAll ? '只看常用区服' : '显示全部区服'}
        </Button>
      </div>

      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        填入 Steam 商店各区本币标价，按汇率换算到同一货币后比价。汇率可手改，也可拉取市场中间价。
        「购卡折扣」用于礼品卡/第三方充值低于面值的场景（如 0.85 = 八五折）；国区直充通常填 1。
        {fxDate ? ` 当前汇率日期：${fxDate}。` : ''}
      </p>

      {fxError && <Alert type="error">{fxError}</Alert>}

      <ToolSection label="区服标价与汇率">
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)] text-left text-[var(--text-muted)]">
                <th className="px-3 py-2 font-medium">启用</th>
                <th className="px-3 py-2 font-medium">区服</th>
                <th className="px-3 py-2 font-medium">本币价格</th>
                <th className="px-3 py-2 font-medium">汇率</th>
                <th className="px-3 py-2 font-medium">购卡折扣</th>
              </tr>
            </thead>
            <tbody>
              {visibleRegions.map((region) => (
                <RegionEditorRow
                  key={region.id}
                  region={region}
                  base={base}
                  state={rows[region.id]}
                  onChange={(patch) => updateRow(region.id, patch)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </ToolSection>

      {'error' in result && result.error ? (
        <Alert type="error">{result.error}</Alert>
      ) : (
        result.rows && (
          <ToolSection
            label="比价结果（按实际成本从低到高）"
            action={result.copy ? <CopyButton text={result.copy} /> : undefined}
          >
            {result.cheapest && (
              <Alert type="success">
                当前最便宜：{result.cheapest.name}，约 {formatMoney(result.cheapest.effective)} {base}
                {result.cn && result.cheapest.regionId !== 'cn'
                  ? `（相对国区 ${formatPercent(savingsVsRef(result.cheapest.effective, result.cn.effective) ?? 0)}）`
                  : ''}
              </Alert>
            )}
            <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)] text-left text-[var(--text-muted)]">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">区服</th>
                    <th className="px-3 py-2 font-medium">本币</th>
                    <th className="px-3 py-2 font-medium">中间价换算</th>
                    <th className="px-3 py-2 font-medium">实际成本</th>
                    <th className="px-3 py-2 font-medium">相对国区</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => {
                    const vs = result.cn ? savingsVsRef(row.effective, result.cn.effective) : null
                    return (
                      <tr
                        key={row.regionId}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-3 py-2 tabular-nums text-[var(--text-muted)]">{index + 1}</td>
                        <td className="px-3 py-2">
                          <span className="font-medium text-[var(--text)]">{row.name}</span>
                          <span className="ml-1.5 text-xs text-[var(--text-muted)]">{row.currency}</span>
                          {row.note && (
                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{row.note}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {formatMoney(row.localPrice)}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {formatMoney(row.converted)} {base}
                        </td>
                        <td className="px-3 py-2 font-mono font-medium tabular-nums text-[var(--text)]">
                          {formatMoney(row.effective)} {base}
                          {row.discount < 1 && (
                            <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">
                              ×{row.discount}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {row.regionId === 'cn'
                            ? '—'
                            : vs == null
                              ? '—'
                              : formatPercent(vs)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ToolSection>
        )
      )}
    </ToolPanel>
  )
}

function RegionEditorRow({
  region,
  base,
  state,
  onChange,
}: {
  region: SteamRegionMeta
  base: SteamCurrencyCode
  state: RegionRowState
  onChange: (patch: Partial<RegionRowState>) => void
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="size-4 accent-[var(--accent)]"
          aria-label={`启用${region.name}`}
        />
      </td>
      <td className="px-3 py-2">
        <div className="font-medium text-[var(--text)]">
          {region.name}
          <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">{region.currency}</span>
        </div>
        {region.note && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{region.note}</p>}
      </td>
      <td className="px-3 py-2">
        <Input
          value={state.price}
          onChange={(v) => onChange({ price: v, enabled: true })}
          type="number"
          placeholder="商店标价"
        />
      </td>
      <td className="px-3 py-2">
        <Input value={state.rate} onChange={(v) => onChange({ rate: v })} type="number" />
        <p className="mt-1 text-xs text-[var(--text-muted)]">{rateLabel(region.currency, base)}</p>
      </td>
      <td className="px-3 py-2">
        <Input value={state.discount} onChange={(v) => onChange({ discount: v })} type="number" />
      </td>
    </tr>
  )
}
