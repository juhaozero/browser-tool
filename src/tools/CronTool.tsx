import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, Select, ToolPanel, ToolSection } from '@/components/ui'
import { CRON_PRESETS, describeCron, getNextCronRuns, validateCron } from '@/lib/cron-utils'

const EXAMPLE_CRON = '0 9 * * 1'

function applyCronExpression(
  value: string,
  setExpr: (v: string) => void,
  setFields: (fields: { minute: string; hour: string; day: string; month: string; dow: string }) => void,
) {
  const parts = value.trim().split(/\s+/)
  if (parts.length !== 5) return
  const [minute, hour, day, month, dow] = parts
  setExpr(value)
  setFields({ minute, hour, day, month, dow })
}

export default function CronTool() {
  const [mode, setMode] = useState<'parse' | 'build'>('parse')
  const [expr, setExpr] = useState(EXAMPLE_CRON)
  const [preset, setPreset] = useState('')
  const [minute, setMinute] = useState('0')
  const [hour, setHour] = useState('9')
  const [day, setDay] = useState('*')
  const [month, setMonth] = useState('*')
  const [dow, setDow] = useState('1')

  const setFields = (fields: { minute: string; hour: string; day: string; month: string; dow: string }) => {
    setMinute(fields.minute)
    setHour(fields.hour)
    setDay(fields.day)
    setMonth(fields.month)
    setDow(fields.dow)
  }

  const applyPreset = (value: string) => {
    if (!value) return
    applyCronExpression(value, setExpr, setFields)
    setPreset(value)
  }

  const built = `${minute} ${hour} ${day} ${month} ${dow}`
  const activeExpr = mode === 'build' ? built : expr

  const description = useMemo(() => describeCron(activeExpr), [activeExpr])
  const validation = useMemo(() => validateCron(activeExpr), [activeExpr])
  const nextRuns = useMemo(() => {
    if (validation) return null
    const result = getNextCronRuns(activeExpr, 5)
    return typeof result === 'string' ? null : result
  }, [activeExpr, validation])

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => { applyPreset('0 9 * * 1'); setMode('parse') }} />
        <Button variant={mode === 'parse' ? 'primary' : 'secondary'} onClick={() => setMode('parse')}>
          解析
        </Button>
        <Button
          variant={mode === 'build' ? 'primary' : 'secondary'}
          onClick={() => {
            setMode('build')
            if (!validateCron(expr)) applyCronExpression(expr, setExpr, setFields)
          }}
        >
          生成
        </Button>
        <Select
          value={preset}
          onChange={applyPreset}
          options={[{ value: '', label: '选择预设...' }, ...CRON_PRESETS.map((p) => ({ value: p.value, label: p.label }))]}
        />
      </div>

      {mode === 'parse' ? (
        <ToolSection label="Cron 表达式 (分 时 日 月 周)" action={<CopyButton text={expr} />}>
          <Input
            value={expr}
            onChange={(v) => {
              setExpr(v)
              setPreset('')
            }}
            placeholder="0 9 * * 1"
          />
        </ToolSection>
      ) : (
        <div className="grid gap-3 sm:grid-cols-5">
          {(
            [
              ['分', minute, setMinute],
              ['时', hour, setHour],
              ['日', day, setDay],
              ['月', month, setMonth],
              ['周', dow, setDow],
            ] as [string, string, (v: string) => void][]
          ).map(([label, val, setter]) => (
            <div key={label} className="space-y-1">
              <label className="text-sm text-[var(--text-muted)]">{label}</label>
              <Input
                value={val}
                onChange={(v) => {
                  setter(v)
                  setPreset('')
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-[var(--bg-muted)] p-4 text-sm">
        <div className="font-mono text-lg">{activeExpr}</div>
        {validation ? (
          <Alert type="error">{validation}</Alert>
        ) : (
          <>
            <p className="mt-2 text-[var(--text-muted)]">{description}</p>
            {nextRuns && nextRuns.runs.length > 0 && (
              <ul className="mt-3 space-y-1">
                <li className="text-[var(--text-muted)]">接下来 {nextRuns.runs.length} 次执行：</li>
                {nextRuns.runs.map((d, i) => (
                  <li key={i} className="font-mono">{d.toLocaleString('zh-CN')}</li>
                ))}
                {nextRuns.incomplete && (
                  <li className="text-[var(--text-muted)]">一年内未找到更多匹配时间</li>
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </ToolPanel>
  )
}
