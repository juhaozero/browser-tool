import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, Select, ToolPanel, ToolSection } from '@/components/ui'
import { CRON_PRESETS, describeCron, getNextCronRuns, validateCron } from '@/lib/cron-utils'

const EXAMPLE_CRON = '0 9 * * 1'

export default function CronTool() {
  const [mode, setMode] = useState<'parse' | 'build'>('parse')
  const [expr, setExpr] = useState(EXAMPLE_CRON)
  const [minute, setMinute] = useState('0')
  const [hour, setHour] = useState('9')
  const [day, setDay] = useState('*')
  const [month, setMonth] = useState('*')
  const [dow, setDow] = useState('1')

  const built = `${minute} ${hour} ${day} ${month} ${dow}`
  const activeExpr = mode === 'build' ? built : expr

  const description = useMemo(() => describeCron(activeExpr), [activeExpr])
  const validation = useMemo(() => validateCron(activeExpr), [activeExpr])
  const nextRuns = useMemo(() => {
    if (validation) return null
    const runs = getNextCronRuns(activeExpr, 5)
    return Array.isArray(runs) ? runs : null
  }, [activeExpr, validation])

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => { setExpr(EXAMPLE_CRON); setMode('parse') }} />
        <Button variant={mode === 'parse' ? 'primary' : 'secondary'} onClick={() => setMode('parse')}>
          解析
        </Button>
        <Button variant={mode === 'build' ? 'primary' : 'secondary'} onClick={() => setMode('build')}>
          生成
        </Button>
        <Select
          value=""
          onChange={(v) => v && setExpr(v)}
          options={[{ value: '', label: '选择预设...' }, ...CRON_PRESETS.map((p) => ({ value: p.value, label: p.label }))]}
        />
      </div>

      {mode === 'parse' ? (
        <ToolSection label="Cron 表达式 (分 时 日 月 周)" action={<CopyButton text={expr} />}>
          <Input value={expr} onChange={setExpr} placeholder="0 9 * * 1" />
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
              <Input value={val} onChange={setter} />
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
            {nextRuns && (
              <ul className="mt-3 space-y-1">
                <li className="text-[var(--text-muted)]">接下来 5 次执行：</li>
                {nextRuns.map((d, i) => (
                  <li key={i} className="font-mono">{d.toLocaleString('zh-CN')}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </ToolPanel>
  )
}
