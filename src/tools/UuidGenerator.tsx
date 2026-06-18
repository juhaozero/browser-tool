import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { generateUuidV4 } from '@/lib/utils'
import { parseIntInRange } from '@/lib/input-validation'

export default function UuidGenerator() {
  const [count, setCount] = useState('5')
  const [uuids, setUuids] = useState<string[]>([])
  const [error, setError] = useState('')

  const generate = () => {
    const parsed = parseIntInRange(count, 1, 100, '生成数量')
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    setError('')
    setUuids(Array.from({ length: parsed.value }, () => generateUuidV4()))
  }

  const output = uuids.join('\n')

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <ExampleButton onClick={() => { setCount('3'); setUuids(['550e8400-e29b-41d4-a716-446655440000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', '6ba7b811-9dad-11d1-80b4-00c04fd430c8']) }} label="示例 UUID" />
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">生成数量 (1-100)</label>
          <Input value={count} onChange={setCount} type="number" placeholder="5" />
        </div>
        <Button variant="primary" onClick={generate}>
          生成 UUID v4
        </Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {uuids.length > 0 && (
        <ToolSection label={`已生成 ${uuids.length} 个`} action={<CopyButton text={output} />}>
          <TextArea value={output} readOnly rows={Math.min(uuids.length + 1, 12)} />
        </ToolSection>
      )}
    </ToolPanel>
  )
}
