import { useEffect, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Button, Input, ToolPanel, ToolSection } from '@/components/ui'

function detectUnit(ts: number): 's' | 'ms' | 'µs' | 'ns' {
  if (ts > 1e18) return 'ns'
  if (ts > 1e15) return 'µs'
  if (ts > 1e12) return 'ms'
  return 's'
}

function toMs(ts: number, unit: 's' | 'ms' | 'µs' | 'ns'): number {
  switch (unit) {
    case 's':
      return ts * 1000
    case 'ms':
      return ts
    case 'µs':
      return ts / 1000
    case 'ns':
      return ts / 1e6
  }
}

export default function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('')
  const [datetime, setDatetime] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const fromTimestamp = (ts: string) => {
    const num = Number(ts)
    if (!Number.isFinite(num)) return
    const unit = detectUnit(num)
    const date = new Date(toMs(num, unit))
    setDatetime(date.toISOString().slice(0, 19))
  }

  const fromDatetime = (dt: string) => {
    const date = new Date(dt)
    if (Number.isNaN(date.getTime())) return
    setTimestamp(String(Math.floor(date.getTime() / 1000)))
  }

  const useNow = () => {
    setTimestamp(String(Math.floor(now / 1000)))
    setDatetime(new Date(now).toISOString().slice(0, 19))
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex gap-2">
        <ExampleButton onClick={() => { setTimestamp('1700000000'); setDatetime('2023-11-14T22:13:20') }} />
        <Button variant="primary" onClick={useNow}>
          使用当前时间
        </Button>
        <CopyButton text={String(Math.floor(now / 1000))} label="复制当前秒级时间戳" />
      </div>

      <ToolSection label="Unix 时间戳（秒）">
        <Input
          value={timestamp}
          onChange={(v) => {
            setTimestamp(v)
            fromTimestamp(v)
          }}
          placeholder="1700000000"
        />
      </ToolSection>

      <ToolSection label="日期时间 (ISO 8601)">
        <Input
          value={datetime}
          onChange={(v) => {
            setDatetime(v)
            fromDatetime(v)
          }}
          placeholder="2024-01-01T00:00:00"
        />
      </ToolSection>

      {timestamp && (
        <div className="grid gap-2 rounded-lg bg-[var(--bg-muted)] p-4 text-sm sm:grid-cols-2">
          <div>
            <span className="text-[var(--text-muted)]">毫秒：</span>
            {Number(timestamp) * 1000}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">UTC：</span>
            {datetime ? new Date(datetime).toUTCString() : '-'}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">本地：</span>
            {datetime ? new Date(datetime).toLocaleString('zh-CN') : '-'}
          </div>
        </div>
      )}
    </ToolPanel>
  )
}
