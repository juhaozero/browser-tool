import { useCallback, useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, ToolPanel, ToolSection, TextArea } from '@/components/ui'

const BASE = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
}

const AMBIGUOUS = new Set('0Ool1I'.split(''))

function filterAmbiguous(charset: string): string {
  return [...charset].filter((c) => !AMBIGUOUS.has(c)).join('')
}

function shufflePick(charset: string, count: number): string[] {
  const arr = [...charset]
  const result: string[] = []
  for (let i = 0; i < count && arr.length; i++) {
    const idx = crypto.getRandomValues(new Uint8Array(1))[0] % arr.length
    result.push(arr.splice(idx, 1)[0])
  }
  return result
}

function assessStrength(password: string): { score: number; label: string; tips: string[] } {
  let score = 0
  const tips: string[] = []
  if (password.length >= 12) score += 2
  else if (password.length >= 8) score += 1
  else tips.push('建议长度至少 12 位')
  if (/[a-z]/.test(password)) score += 1
  else tips.push('缺少小写字母')
  if (/[A-Z]/.test(password)) score += 1
  else tips.push('缺少大写字母')
  if (/\d/.test(password)) score += 1
  else tips.push('缺少数字')
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  else tips.push('缺少特殊字符')
  if (password.length >= 16) score += 1
  const labels = ['弱', '较弱', '一般', '强', '很强']
  return { score, label: labels[Math.min(score, 4)], tips }
}

export default function PasswordGenerator() {
  const [length, setLength] = useState('16')
  const [useLower, setUseLower] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useDigits, setUseDigits] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false)
  const [minDigits, setMinDigits] = useState('1')
  const [minSymbols, setMinSymbols] = useState('1')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const strength = useMemo(() => (password ? assessStrength(password) : null), [password])

  const generate = useCallback(() => {
    setError('')
    let lower = BASE.lower
    let upper = BASE.upper
    let digits = BASE.digits
    let symbols = BASE.symbols
    if (avoidAmbiguous) {
      lower = filterAmbiguous(lower)
      upper = filterAmbiguous(upper)
      digits = filterAmbiguous(digits)
      symbols = filterAmbiguous(symbols)
    }

    let charset = ''
    if (useLower) charset += lower
    if (useUpper) charset += upper
    if (useDigits) charset += digits
    if (useSymbols) charset += symbols
    if (!charset) {
      setError('请至少选择一种字符类型')
      return
    }

    const len = Math.min(Math.max(parseInt(length, 10) || 16, 4), 128)
    const minD = useDigits ? Math.min(parseInt(minDigits, 10) || 0, len) : 0
    const minS = useSymbols ? Math.min(parseInt(minSymbols, 10) || 0, len) : 0
    if (minD + minS > len) {
      setError('最少数字与特殊字符个数之和不能超过密码长度')
      return
    }

    const required = [
      ...shufflePick(digits, minD),
      ...shufflePick(symbols, minS),
    ]
    const remaining = len - required.length
    const bytes = new Uint8Array(remaining)
    crypto.getRandomValues(bytes)
    const rest = Array.from(bytes, (b) => charset[b % charset.length])
    const combined = [...required, ...rest]
    for (let i = combined.length - 1; i > 0; i--) {
      const j = crypto.getRandomValues(new Uint8Array(1))[0] % (i + 1)
      ;[combined[i], combined[j]] = [combined[j], combined[i]]
    }
    setPassword(combined.join(''))
  }, [length, useLower, useUpper, useDigits, useSymbols, avoidAmbiguous, minDigits, minSymbols])

  return (
    <ToolPanel className="space-y-4">
      <ExampleButton onClick={generate} label="生成示例密码" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">密码长度 (4-128)</label>
          <Input value={length} onChange={setLength} type="number" />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {(
            [
              ['小写字母', useLower, setUseLower],
              ['大写字母', useUpper, setUseUpper],
              ['数字', useDigits, setUseDigits],
              ['符号', useSymbols, setUseSymbols],
              ['避免易混淆字符 (0/O/l/1/I)', avoidAmbiguous, setAvoidAmbiguous],
            ] as const
          ).map(([label, checked, setter]) => (
            <label key={label} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={checked} onChange={(e) => setter(e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">最少数字个数</label>
          <Input value={minDigits} onChange={setMinDigits} type="number" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">最少特殊字符个数</label>
          <Input value={minSymbols} onChange={setMinSymbols} type="number" />
        </div>
      </div>

      <Button variant="primary" onClick={generate}>
        生成密码
      </Button>

      {error && <Alert type="error">{error}</Alert>}

      {password && (
        <>
          <ToolSection label="生成的密码" action={<CopyButton text={password} />}>
            <TextArea value={password} readOnly rows={2} />
          </ToolSection>
          {strength && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[var(--text-muted)]">强度：</span>
                <span className="font-semibold">{strength.label}</span>
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-2 flex-1 rounded-full"
                      style={{
                        backgroundColor:
                          i <= strength.score
                            ? strength.score >= 4
                              ? 'var(--success)'
                              : strength.score >= 2
                                ? 'var(--accent)'
                                : 'var(--error)'
                            : 'var(--border)',
                      }}
                    />
                  ))}
                </div>
              </div>
              {strength.tips.length > 0 && (
                <ul className="list-inside list-disc text-[var(--text-muted)]">
                  {strength.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </ToolPanel>
  )
}
