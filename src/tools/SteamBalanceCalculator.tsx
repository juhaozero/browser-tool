import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Input, Select, ToolPanel, ToolSection } from '@/components/ui'
import {
  DEFAULT_STEAM_FEE_RATE,
  buyerPayFromReceive,
  formatDiscountZhe,
  formatRatioPercent,
  hangKnifeRatio,
  maxPlatformCostForRatio,
  receiveFromBuyerPay,
  receiveNeededForRatio,
  roundMoney,
  steamFeeAmount,
} from '@/lib/steam-balance'

type Mode = 'fee' | 'ratio' | 'plan'

function parseAmount(raw: string, label: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: `请输入${label}` }
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return { ok: false, error: `${label}须为非负数字` }
  return { ok: true, value: n }
}

function parseFeePercent(raw: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: '请输入手续费率' }
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0 || n >= 100) {
    return { ok: false, error: '手续费率须在 0–100 之间（例如 15）' }
  }
  return { ok: true, value: n / 100 }
}

function parseRatioInput(raw: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: '请输入目标比例' }
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: '目标比例须为正数' }
  // 支持 0.75 或 75（百分比）或 7.5（折）
  if (n > 10) return { ok: true, value: n / 100 }
  if (n > 1) return { ok: true, value: n / 10 }
  return { ok: true, value: n }
}

function moneyText(n: number): string {
  return roundMoney(n, 2).toFixed(2)
}

function ResultRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
      <p className="shrink-0 font-mono text-sm font-medium tabular-nums text-[var(--text)]">{value}</p>
    </div>
  )
}

export default function SteamBalanceCalculator() {
  const [mode, setMode] = useState<Mode>('ratio')
  const [feePercent, setFeePercent] = useState(String(DEFAULT_STEAM_FEE_RATE * 100))
  const [buyerPay, setBuyerPay] = useState('115')
  const [receive, setReceive] = useState('100')
  const [platformCost, setPlatformCost] = useState('75')
  const [targetRatio, setTargetRatio] = useState('0.75')
  const [planBase, setPlanBase] = useState<'cost' | 'receive'>('cost')

  const result = useMemo(() => {
    const fee = parseFeePercent(feePercent)
    if (!fee.ok) return { error: fee.error as string }

    try {
      if (mode === 'fee') {
        const fromBuyer = buyerPay.trim() !== ''
        const fromReceive = receive.trim() !== ''
        if (!fromBuyer && !fromReceive) return { error: '请输入挂牌价或到手金额' }

        // 优先用最近编辑的一侧：两边都有时以挂牌价为准，避免互相覆盖歧义
        if (fromBuyer) {
          const pay = parseAmount(buyerPay, '挂牌价')
          if (!pay.ok) return { error: pay.error }
          const got = receiveFromBuyerPay(pay.value, fee.value)
          const feeAmt = steamFeeAmount(pay.value, fee.value)
          return {
            error: '',
            rows: [
              { label: '买家支付（挂牌价）', value: moneyText(pay.value) },
              { label: '卖家到手（钱包余额）', value: moneyText(got) },
              { label: '手续费合计', value: moneyText(feeAmt), hint: `费率 ${(fee.value * 100).toFixed(0)}%` },
              { label: '到手占比', value: formatRatioPercent(got / pay.value) },
            ],
            copy: `挂牌 ${moneyText(pay.value)} → 到手 ${moneyText(got)}（手续费 ${moneyText(feeAmt)}）`,
          }
        }

        const got = parseAmount(receive, '到手金额')
        if (!got.ok) return { error: got.error }
        const pay = buyerPayFromReceive(got.value, fee.value)
        const feeAmt = pay - got.value
        return {
          error: '',
          rows: [
            { label: '卖家到手（钱包余额）', value: moneyText(got.value) },
            { label: '应挂牌价（买家支付）', value: moneyText(pay) },
            { label: '手续费合计', value: moneyText(feeAmt), hint: `费率 ${(fee.value * 100).toFixed(0)}%` },
          ],
          copy: `到手 ${moneyText(got.value)} → 挂牌 ${moneyText(pay)}`,
        }
      }

      if (mode === 'ratio') {
        const cost = parseAmount(platformCost, '平台买入价')
        if (!cost.ok) return { error: cost.error }

        let steamReceive: number
        if (receive.trim()) {
          const got = parseAmount(receive, 'Steam 到手')
          if (!got.ok) return { error: got.error }
          steamReceive = got.value
        } else if (buyerPay.trim()) {
          const pay = parseAmount(buyerPay, '挂牌价')
          if (!pay.ok) return { error: pay.error }
          steamReceive = receiveFromBuyerPay(pay.value, fee.value)
        } else {
          return { error: '请填写 Steam 到手金额，或填写挂牌价由手续费反推' }
        }

        const ratio = hangKnifeRatio(cost.value, steamReceive)
        const listPrice = buyerPayFromReceive(steamReceive, fee.value)
        return {
          error: '',
          rows: [
            { label: '平台买入价', value: moneyText(cost.value) },
            { label: 'Steam 到手余额', value: moneyText(steamReceive) },
            { label: '对应挂牌价', value: moneyText(listPrice), hint: '买家实际支付' },
            {
              label: '倒余额比例',
              value: ratio.toFixed(4).replace(/\.?0+$/, ''),
              hint: `${formatDiscountZhe(ratio)} · ${formatRatioPercent(ratio)}`,
            },
            {
              label: '相对直充节省',
              value: formatRatioPercent(1 - ratio),
              hint: ratio >= 1 ? '高于或等于直充，不划算' : '相对 1.0 直充',
            },
          ],
          copy: `平台 ${moneyText(cost.value)} / 到手 ${moneyText(steamReceive)} = ${ratio.toFixed(4)}（${formatDiscountZhe(ratio)}）`,
        }
      }

      // plan
      const ratio = parseRatioInput(targetRatio)
      if (!ratio.ok) return { error: ratio.error }

      if (planBase === 'cost') {
        const cost = parseAmount(platformCost, '平台买入价')
        if (!cost.ok) return { error: cost.error }
        const needReceive = receiveNeededForRatio(cost.value, ratio.value)
        const listPrice = buyerPayFromReceive(needReceive, fee.value)
        return {
          error: '',
          rows: [
            { label: '平台预算', value: moneyText(cost.value) },
            { label: '目标比例', value: `${ratio.value}（${formatDiscountZhe(ratio.value)}）` },
            { label: '需到手余额', value: moneyText(needReceive) },
            { label: '建议挂牌价', value: moneyText(listPrice) },
          ],
          copy: `预算 ${moneyText(cost.value)} @ ${formatDiscountZhe(ratio.value)} → 到手 ${moneyText(needReceive)} / 挂牌 ${moneyText(listPrice)}`,
        }
      }

      const got = parseAmount(receive, '目标到手')
      if (!got.ok) return { error: got.error }
      const maxCost = maxPlatformCostForRatio(got.value, ratio.value)
      const listPrice = buyerPayFromReceive(got.value, fee.value)
      return {
        error: '',
        rows: [
          { label: '目标到手余额', value: moneyText(got.value) },
          { label: '目标比例', value: `${ratio.value}（${formatDiscountZhe(ratio.value)}）` },
          { label: '平台最多可花', value: moneyText(maxCost) },
          { label: '对应挂牌价', value: moneyText(listPrice) },
        ],
        copy: `到手 ${moneyText(got.value)} @ ${formatDiscountZhe(ratio.value)} → 平台 ≤ ${moneyText(maxCost)}`,
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : '计算失败' }
    }
  }, [mode, feePercent, buyerPay, receive, platformCost, targetRatio, planBase])

  const loadExample = () => {
    setMode('ratio')
    setFeePercent('15')
    setPlatformCost('75')
    setBuyerPay('115')
    setReceive('100')
    setTargetRatio('0.75')
    setPlanBase('cost')
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <ExampleButton onClick={loadExample} />
        <Select
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            { value: 'ratio', label: '倒余额比例' },
            { value: 'fee', label: '手续费换算' },
            { value: 'plan', label: '目标反推' },
          ]}
        />
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">市场手续费 (%)</label>
          <Input value={feePercent} onChange={setFeePercent} type="number" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        Steam 市场默认收取约 15% 手续费（按卖家到手计）。倒余额比例 = 平台买入价 ÷ Steam
        到手余额，数值越低越划算（如 0.75 = 七五折）。
      </p>

      {mode === 'fee' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ToolSection label="挂牌价（买家支付）">
            <Input
              value={buyerPay}
              onChange={(v) => {
                setBuyerPay(v)
                const fee = parseFeePercent(feePercent)
                const pay = parseAmount(v, '挂牌价')
                if (fee.ok && pay.ok) setReceive(String(roundMoney(receiveFromBuyerPay(pay.value, fee.value), 4)))
              }}
              type="number"
              placeholder="例如 115"
            />
          </ToolSection>
          <ToolSection label="卖家到手（钱包余额）">
            <Input
              value={receive}
              onChange={(v) => {
                setReceive(v)
                const fee = parseFeePercent(feePercent)
                const got = parseAmount(v, '到手')
                if (fee.ok && got.ok) setBuyerPay(String(roundMoney(buyerPayFromReceive(got.value, fee.value), 4)))
              }}
              type="number"
              placeholder="例如 100"
            />
          </ToolSection>
        </div>
      )}

      {mode === 'ratio' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <ToolSection label="第三方平台买入价">
            <Input value={platformCost} onChange={setPlatformCost} type="number" placeholder="例如 75" />
          </ToolSection>
          <ToolSection label="Steam 到手余额">
            <Input value={receive} onChange={setReceive} type="number" placeholder="例如 100" />
          </ToolSection>
          <ToolSection label="或填挂牌价（可选）">
            <Input
              value={buyerPay}
              onChange={(v) => {
                setBuyerPay(v)
                const fee = parseFeePercent(feePercent)
                const pay = parseAmount(v, '挂牌价')
                if (fee.ok && pay.ok) setReceive(String(roundMoney(receiveFromBuyerPay(pay.value, fee.value), 4)))
              }}
              type="number"
              placeholder="例如 115"
            />
          </ToolSection>
        </div>
      )}

      {mode === 'plan' && (
        <div className="space-y-3">
          <Select
            value={planBase}
            onChange={(v) => setPlanBase(v as 'cost' | 'receive')}
            options={[
              { value: 'cost', label: '已知平台预算 → 推算到手 / 挂牌' },
              { value: 'receive', label: '已知目标到手 → 推算最多可花' },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {planBase === 'cost' ? (
              <ToolSection label="平台预算">
                <Input value={platformCost} onChange={setPlatformCost} type="number" />
              </ToolSection>
            ) : (
              <ToolSection label="目标到手余额">
                <Input value={receive} onChange={setReceive} type="number" />
              </ToolSection>
            )}
            <ToolSection label="目标比例（0.75 / 7.5折 / 75%）">
              <Input value={targetRatio} onChange={setTargetRatio} placeholder="0.75" />
            </ToolSection>
          </div>
        </div>
      )}

      {'error' in result && result.error ? (
        <Alert type="error">{result.error}</Alert>
      ) : (
        result.rows && (
          <ToolSection
            label="计算结果"
            action={result.copy ? <CopyButton text={result.copy} /> : undefined}
          >
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3">
              {result.rows.map((row) => (
                <ResultRow key={row.label} {...row} />
              ))}
            </div>
          </ToolSection>
        )
      )}
    </ToolPanel>
  )
}
