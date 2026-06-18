import { useEffect, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, ToolPanel, ToolSection } from '@/components/ui'
import { validateNumericTimestamp } from '@/lib/input-validation'

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

function toIsoLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function syncFromMs(ms: number, setTimestamp: (v: string) => void, setTimestampMs: (v: string) => void, setDatetime: (v: string) => void) {
  setTimestamp(String(Math.floor(ms / 1000)))
  setTimestampMs(String(ms))
  setDatetime(toIsoLocal(new Date(ms)))
}

export default function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('')
  const [timestampMs, setTimestampMs] = useState('')
  const [datetime, setDatetime] = useState('')
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const fromTimestamp = (ts: string) => {
    if (!ts.trim()) {
      setError('')
      return
    }
    const validated = validateNumericTimestamp(ts, '时间戳')
    if (typeof validated === 'string') {
      setError(validated)
      return
    }
    setError('')
    const unit = detectUnit(validated)
    syncFromMs(toMs(validated, unit), setTimestamp, setTimestampMs, setDatetime)
  }

  const fromTimestampMs = (tsMs: string) => {
    if (!tsMs.trim()) {
      setError('')
      return
    }
    const validated = validateNumericTimestamp(tsMs, '毫秒时间戳')
    if (typeof validated === 'string') {
      setError(validated)
      return
    }
    setError('')
    syncFromMs(validated, setTimestamp, setTimestampMs, setDatetime)
  }

  const fromDatetime = (dt: string) => {
    if (!dt.trim()) {
      setError('')
      return
    }
    const date = new Date(dt)
    if (Number.isNaN(date.getTime())) {
      setError('请输入有效的 ISO 8601 日期时间，如 2024-01-01T00:00:00')
      return
    }
    setError('')
    syncFromMs(date.getTime(), setTimestamp, setTimestampMs, setDatetime)
  }

  const useNow = () => {
    setError('')
    syncFromMs(now, setTimestamp, setTimestampMs, setDatetime)
  }

  const displayDate = timestampMs && !error ? new Date(Number(timestampMs)) : null

  return (
    <ToolPanel className="space-y-4">
      <div className="flex gap-2">
        <ExampleButton
          onClick={() => {
            setError('')
            syncFromMs(1700000000000, setTimestamp, setTimestampMs, setDatetime)
          }}
        />
        <Button variant="primary" onClick={useNow}>
          使用当前时间
        </Button>
        <CopyButton text={String(Math.floor(now / 1000))} label="复制当前秒级时间戳" />
        <CopyButton text={String(now)} label="复制当前毫秒级时间戳" />
      </div>

      {error && <Alert type="error">{error}</Alert>}

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
      <ToolSection label="Unix 时间戳（毫秒）">
        <Input
          value={timestampMs}
          onChange={(v) => {
            setTimestampMs(v)
            fromTimestampMs(v)
          }}
          placeholder="1700000000000"
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

      {displayDate && !Number.isNaN(displayDate.getTime()) && (
        <div className="grid gap-2 rounded-lg bg-[var(--bg-muted)] p-4 text-sm sm:grid-cols-2">
          <div>
            <span className="text-[var(--text-muted)]">毫秒：</span>
            {timestampMs}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">UTC：</span>
            {displayDate.toUTCString()}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">本地：</span>
            {displayDate.toLocaleString()}
          </div>
        </div>
      )}
    </ToolPanel>
  )
}
