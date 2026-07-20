import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { generateNanoId, generateUlid, Hashids } from '@/lib/id-generators'
import { parseIntInRange } from '@/lib/input-validation'

type Mode = 'nanoid' | 'ulid' | 'hashids'

export default function IdGenerator() {
  const [mode, setMode] = useState<Mode>('nanoid')
  const [count, setCount] = useState('5')
  const [size, setSize] = useState('21')
  const [salt, setSalt] = useState('browser-tool')
  const [minLength, setMinLength] = useState('8')
  const [numbers, setNumbers] = useState('1,2,3')
  const [hashInput, setHashInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const generate = () => {
    setError('')
    try {
      if (mode === 'nanoid') {
        const countParsed = parseIntInRange(count, 1, 100, '生成数量')
        if (!countParsed.ok) throw new Error(countParsed.error)
        const sizeParsed = parseIntInRange(size, 1, 128, '长度')
        if (!sizeParsed.ok) throw new Error(sizeParsed.error)
        setOutput(
          Array.from({ length: countParsed.value }, () => generateNanoId(sizeParsed.value)).join('\n'),
        )
        return
      }

      if (mode === 'ulid') {
        const countParsed = parseIntInRange(count, 1, 100, '生成数量')
        if (!countParsed.ok) throw new Error(countParsed.error)
        setOutput(Array.from({ length: countParsed.value }, () => generateUlid()).join('\n'))
        return
      }

      const minParsed = parseIntInRange(minLength, 0, 64, '最小长度')
      if (!minParsed.ok) throw new Error(minParsed.error)
      const nums = numbers
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const n = Number(s)
          if (!Number.isInteger(n) || n < 0) throw new Error(`无效整数: ${s}`)
          return n
        })
      if (nums.length === 0) throw new Error('请输入至少一个非负整数')
      const hashids = new Hashids(salt, minParsed.value)
      setOutput(hashids.encode(...nums))
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
      setOutput('')
    }
  }

  const decodeHash = () => {
    setError('')
    try {
      const minParsed = parseIntInRange(minLength, 0, 64, '最小长度')
      if (!minParsed.ok) throw new Error(minParsed.error)
      if (!hashInput.trim()) throw new Error('请输入要解码的 Hashid')
      const hashids = new Hashids(salt, minParsed.value)
      const decoded = hashids.decode(hashInput.trim())
      setOutput(decoded.length ? decoded.join(', ') : '(无法解码)')
    } catch (e) {
      setError(e instanceof Error ? e.message : '解码失败')
      setOutput('')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <ExampleButton
          onClick={() => {
            setMode('nanoid')
            setCount('3')
            setSize('21')
            setOutput('')
            setError('')
          }}
        />
        <Select
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            { value: 'nanoid', label: 'NanoID' },
            { value: 'ulid', label: 'ULID' },
            { value: 'hashids', label: 'Hashids' },
          ]}
        />
        {(mode === 'nanoid' || mode === 'ulid') && (
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-muted)]">数量</label>
            <Input value={count} onChange={setCount} type="number" />
          </div>
        )}
        {mode === 'nanoid' && (
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-muted)]">长度</label>
            <Input value={size} onChange={setSize} type="number" />
          </div>
        )}
        <Button variant="primary" onClick={generate}>
          {mode === 'hashids' ? '编码' : '生成'}
        </Button>
      </div>

      {mode === 'hashids' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ToolSection label="Salt">
            <Input value={salt} onChange={setSalt} />
          </ToolSection>
          <ToolSection label="最小长度">
            <Input value={minLength} onChange={setMinLength} type="number" />
          </ToolSection>
          <ToolSection label="整数（逗号分隔）">
            <Input value={numbers} onChange={setNumbers} placeholder="1,2,3" />
          </ToolSection>
          <ToolSection label="解码 Hashid">
            <div className="flex gap-2">
              <Input value={hashInput} onChange={setHashInput} placeholder="粘贴 hashid" />
              <Button onClick={decodeHash}>解码</Button>
            </div>
          </ToolSection>
        </div>
      )}

      {error && <Alert type="error">{error}</Alert>}

      {output && (
        <ToolSection label="输出" action={<CopyButton text={output} />}>
          <TextArea value={output} readOnly rows={Math.min(12, output.split('\n').length + 1)} />
        </ToolSection>
      )}

      <Alert type="info">
        NanoID / ULID 使用 Web Crypto 随机数；Hashids 为简化兼容实现，适合短链 ID，非加密安全。
      </Alert>
    </ToolPanel>
  )
}
