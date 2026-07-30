import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, ToolPanel, ToolSection } from '@/components/ui'
import {
  convertAllRadix,
  type Radix,
  type RadixValues,
} from '@/lib/radix-convert'
import { useToolDraft } from '@/hooks/useToolDraft'

const FIELDS: { key: keyof RadixValues; radix: Radix; label: string; placeholder: string }[] = [
  { key: 'bin', radix: 2, label: '二进制 (Bin)', placeholder: '1010 或 0b1010' },
  { key: 'oct', radix: 8, label: '八进制 (Oct)', placeholder: '12 或 0o12' },
  { key: 'dec', radix: 10, label: '十进制 (Dec)', placeholder: '10' },
  { key: 'hex', radix: 16, label: '十六进制 (Hex)', placeholder: 'A 或 0xA' },
]

const EMPTY: RadixValues = { bin: '', oct: '', dec: '', hex: '' }

export default function RadixConverter() {
  const [active, setActive] = useState<Radix>(10)
  const [input, setInput] = useToolDraft('radix-converter', 'input', '255', { queryParam: 'input' })

  const result = useMemo(() => {
    if (!input.trim()) return { values: EMPTY, error: '' }
    try {
      return { values: convertAllRadix(input, active), error: '' }
    } catch (e) {
      return {
        values: EMPTY,
        error: e instanceof Error ? e.message : '转换失败',
      }
    }
  }, [input, active])

  const onFieldChange = (radix: Radix, value: string) => {
    setActive(radix)
    setInput(value)
  }

  const display = (radix: Radix, key: keyof RadixValues) =>
    radix === active ? input : result.error ? '' : result.values[key]

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => { setActive(10); setInput('255') }} />
        {FIELDS.map((f) => (
          <Button
            key={f.radix}
            variant={active === f.radix ? 'primary' : 'secondary'}
            onClick={() => {
              if (!result.error && result.values[f.key]) {
                setInput(result.values[f.key])
              }
              setActive(f.radix)
            }}
          >
            从{f.label.split(' ')[0]}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => {
          const value = display(f.radix, f.key)
          return (
            <ToolSection
              key={f.key}
              label={f.label}
              action={value ? <CopyButton text={value} /> : undefined}
            >
              <Input
                value={value}
                onChange={(v) => onFieldChange(f.radix, v)}
                placeholder={f.placeholder}
              />
            </ToolSection>
          )
        })}
      </div>

      {result.error ? (
        <Alert type="error">{result.error}</Alert>
      ) : (
        input.trim() !== '' && (
          <div className="rounded-lg bg-[var(--bg-muted)] p-4 font-mono text-sm space-y-1">
            <div>Bin: {result.values.bin}</div>
            <div>Oct: {result.values.oct}</div>
            <div>Dec: {result.values.dec}</div>
            <div>Hex: 0x{result.values.hex}</div>
          </div>
        )
      )}

      <Alert type="info">支持 BigInt 大整数；可用空格或下划线分隔，如 1111_0000 或 0xFF_EE。</Alert>
    </ToolPanel>
  )
}
