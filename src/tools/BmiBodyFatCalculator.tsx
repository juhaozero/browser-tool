import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Input, Select, ToolPanel, ToolSection } from '@/components/ui'
import {
  BMI_CATEGORIES,
  bodyFatFromWeight,
  bodyFatNavy,
  calculateBmi,
  type BodyFatMethod,
  type BmiCategory,
  type Sex,
} from '@/lib/body-metrics'

type Mode = 'bmi' | 'bodyfat'

function parsePositive(raw: string, label: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: `请输入${label}` }
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: `${label}须为正数` }
  return { ok: true, value: n }
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

function CategoryBadge({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'bad' | 'info' }) {
  const styles = {
    ok: 'border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]',
    warn: 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]',
    bad: 'border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_12%,transparent)] text-[var(--error)]',
    info: 'border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-muted)]',
  }
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${styles[tone]}`}>
      {label}
    </span>
  )
}

function bmiTone(id: string): 'ok' | 'warn' | 'bad' | 'info' {
  if (id === 'normal') return 'ok'
  if (id === 'overweight') return 'warn'
  if (id === 'obese') return 'bad'
  return 'info'
}

function bfTone(id: string): 'ok' | 'warn' | 'bad' | 'info' {
  if (id === 'athlete' || id === 'fitness') return 'ok'
  if (id === 'average') return 'warn'
  if (id === 'obese') return 'bad'
  return 'info'
}

function BmiRangeTable({ activeId }: { activeId?: BmiCategory }) {
  return (
    <ToolSection label="标准 BMI 区间（中国成人）">
      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <div className="grid grid-cols-2 gap-px bg-[var(--border)] sm:grid-cols-4">
          {BMI_CATEGORIES.map((cat) => {
            const active = cat.id === activeId
            return (
              <div
                key={cat.id}
                className={`bg-[var(--bg-muted)] px-3 py-3 ${active ? 'ring-2 ring-inset ring-[var(--accent)]' : ''}`}
              >
                <div className="flex items-center gap-1.5">
                  <CategoryBadge label={cat.label} tone={bmiTone(cat.id)} />
                  {active && <span className="text-xs text-[var(--accent)]">当前</span>}
                </div>
                <p className="mt-1.5 font-mono text-sm tabular-nums text-[var(--text)]">{cat.range}</p>
              </div>
            )
          })}
        </div>
      </div>
    </ToolSection>
  )
}

export default function BmiBodyFatCalculator() {
  const [mode, setMode] = useState<Mode>('bmi')
  const [sex, setSex] = useState<Sex>('male')
  const [height, setHeight] = useState('175')
  const [weight, setWeight] = useState('70')
  const [age, setAge] = useState('30')
  const [bfMethod, setBfMethod] = useState<BodyFatMethod>('deurenberg')
  const [neck, setNeck] = useState('38')
  const [waist, setWaist] = useState('80')
  const [hip, setHip] = useState('95')

  const result = useMemo(() => {
    try {
      if (mode === 'bmi') {
        const h = parsePositive(height, '身高')
        if (!h.ok) return { error: h.error }
        const w = parsePositive(weight, '体重')
        if (!w.ok) return { error: w.error }

        const r = calculateBmi(w.value, h.value)
        return {
          error: '',
          mode: 'bmi' as const,
          categoryId: r.category.id,
          badge: { label: r.category.label, tone: bmiTone(r.category.id) },
          advice: r.category.advice,
          rows: [
            { label: 'BMI', value: String(r.bmi), hint: `参考区间 ${r.category.range}` },
            { label: '分类（中国成人标准）', value: r.category.label },
            {
              label: '理想体重区间',
              value: `${r.idealWeightMin} – ${r.idealWeightMax} kg`,
              hint: '对应 BMI 18.5–23.9',
            },
          ],
          copy: `身高 ${h.value} cm / 体重 ${w.value} kg → BMI ${r.bmi}（${r.category.label}），理想体重 ${r.idealWeightMin}–${r.idealWeightMax} kg`,
        }
      }

      const h = parsePositive(height, '身高')
      if (!h.ok) return { error: h.error }

      if (bfMethod === 'deurenberg') {
        const w = parsePositive(weight, '体重')
        if (!w.ok) return { error: w.error }
        const a = parsePositive(age, '年龄')
        if (!a.ok) return { error: a.error }

        const r = bodyFatFromWeight(w.value, h.value, a.value, sex)
        const bmi = calculateBmi(w.value, h.value)
        return {
          error: '',
          badge: { label: r.category.label, tone: bfTone(r.category.id) },
          advice: `基于 BMI ${bmi.bmi}、年龄 ${a.value}、${sex === 'male' ? '男' : '女'}性估算，仅供参考。`,
          rows: [
            { label: '体脂率', value: `${r.percent}%`, hint: r.methodLabel },
            { label: '参考分类', value: r.category.label, hint: r.category.range },
            { label: 'BMI', value: String(bmi.bmi) },
          ],
          copy: `体脂率约 ${r.percent}%（${r.methodLabel}，${r.category.label}）`,
        }
      }

      const n = parsePositive(neck, '颈围')
      if (!n.ok) return { error: n.error }
      const wa = parsePositive(waist, '腰围')
      if (!wa.ok) return { error: wa.error }
      let hipVal: number | undefined
      if (sex === 'female') {
        const hp = parsePositive(hip, '臀围')
        if (!hp.ok) return { error: hp.error }
        hipVal = hp.value
      }

      const r = bodyFatNavy(h.value, n.value, wa.value, sex, hipVal)
      return {
        error: '',
        badge: { label: r.category.label, tone: bfTone(r.category.id) },
        advice: '围度法相对更贴近实测，测量时请保持放松、卷尺水平贴合皮肤。',
        rows: [
          { label: '体脂率', value: `${r.percent}%`, hint: r.methodLabel },
          { label: '参考分类', value: r.category.label, hint: r.category.range },
        ],
        copy: `体脂率约 ${r.percent}%（${r.methodLabel}，${r.category.label}）`,
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : '计算失败' }
    }
  }, [mode, sex, height, weight, age, bfMethod, neck, waist, hip])

  const loadExample = () => {
    setMode('bmi')
    setSex('male')
    setHeight('175')
    setWeight('70')
    setAge('30')
    setBfMethod('deurenberg')
    setNeck('38')
    setWaist('80')
    setHip('95')
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <ExampleButton onClick={loadExample} />
        <Select
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            { value: 'bmi', label: 'BMI 计算器' },
            { value: 'bodyfat', label: '体脂率计算器' },
          ]}
        />
        {mode === 'bodyfat' && (
          <>
            <Select
              value={sex}
              onChange={(v) => setSex(v as Sex)}
              options={[
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性' },
              ]}
            />
            <Select
              value={bfMethod}
              onChange={(v) => setBfMethod(v as BodyFatMethod)}
              options={[
                { value: 'deurenberg', label: '身高体重估算' },
                { value: 'navy', label: '围度法（更准）' },
              ]}
            />
          </>
        )}
      </div>

      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        {mode === 'bmi'
          ? 'BMI = 体重(kg) ÷ 身高(m)²。分类采用中国成人标准（WS/T 428-2013），与国际 WHO 阈值略有不同。'
          : bfMethod === 'deurenberg'
            ? '身高体重估算法（Deurenberg）：适合快速估算，误差相对较大，运动人群可能被高估。'
            : '美军海军围度法：需测量颈围、腰围（女性另需臀围），通常比纯 BMI 估算更接近实测。'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ToolSection label="身高 (cm)">
          <Input value={height} onChange={setHeight} type="number" placeholder="例如 175" />
        </ToolSection>

        {(mode === 'bmi' || bfMethod === 'deurenberg') && (
          <ToolSection label="体重 (kg)">
            <Input value={weight} onChange={setWeight} type="number" placeholder="例如 70" />
          </ToolSection>
        )}

        {mode === 'bodyfat' && bfMethod === 'deurenberg' && (
          <ToolSection label="年龄">
            <Input value={age} onChange={setAge} type="number" placeholder="例如 30" />
          </ToolSection>
        )}

        {mode === 'bodyfat' && bfMethod === 'navy' && (
          <>
            <ToolSection label="颈围 (cm)">
              <Input value={neck} onChange={setNeck} type="number" placeholder="例如 38" />
            </ToolSection>
            <ToolSection label="腰围 (cm)">
              <Input value={waist} onChange={setWaist} type="number" placeholder="例如 80" />
            </ToolSection>
            {sex === 'female' && (
              <ToolSection label="臀围 (cm)">
                <Input value={hip} onChange={setHip} type="number" placeholder="例如 95" />
              </ToolSection>
            )}
          </>
        )}
      </div>

      {'error' in result && result.error ? (
        <Alert type="error">{result.error}</Alert>
      ) : (
        result.rows && (
          <ToolSection
            label="计算结果"
            action={
              <div className="flex items-center gap-2">
                {result.badge && <CategoryBadge label={result.badge.label} tone={result.badge.tone} />}
                {result.copy && <CopyButton text={result.copy} />}
              </div>
            }
          >
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3">
              {result.rows.map((row) => (
                <ResultRow key={row.label} {...row} />
              ))}
            </div>
            {result.advice && (
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{result.advice}</p>
            )}
          </ToolSection>
        )
      )}

      {mode === 'bmi' && (
        <BmiRangeTable
          activeId={'categoryId' in result && !result.error ? result.categoryId : undefined}
        />
      )}
    </ToolPanel>
  )
}
