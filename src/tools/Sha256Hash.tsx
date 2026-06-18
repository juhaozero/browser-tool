import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { bufferToBase64, bufferToHex, hashFile, hashText } from '@/lib/utils'

const EXAMPLE = 'Hello, Browser Tool!'

export default function Sha256Hash() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [format, setFormat] = useState<'hex' | 'base64'>('hex')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)

  const formatBuffer = (buffer: ArrayBuffer, fmt: 'hex' | 'base64' = format) =>
    fmt === 'hex' ? bufferToHex(buffer) : bufferToBase64(buffer)

  const compute = async (text: string) => {
    setLoading(true)
    setError('')
    try {
      const buffer = fileBuffer ?? (await hashText('SHA-256', text))
      setOutput(formatBuffer(buffer))
    } catch (e) {
      setError(e instanceof Error ? e.message : '哈希计算失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const buffer = await hashFile('SHA-256', file)
      setFileBuffer(buffer)
      setOutput(formatBuffer(buffer))
      setInput(`[文件] ${file.name} (${file.size} bytes)`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '文件哈希失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFormatChange = (v: string) => {
    const next = v as 'hex' | 'base64'
    setFormat(next)
    if (fileBuffer) setOutput(formatBuffer(fileBuffer, next))
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ExampleButton
          onClick={() => {
            setInput(EXAMPLE)
            setFileBuffer(null)
            setOutput('')
            setError('')
          }}
        />
        <Select
          value={format}
          onChange={handleFormatChange}
          options={[
            { value: 'hex', label: 'Hex 输出' },
            { value: 'base64', label: 'Base64 输出' },
          ]}
        />
        <Button variant="primary" onClick={() => compute(input)} disabled={loading || (!input && !fileBuffer)}>
          计算哈希
        </Button>
        <label className="cursor-pointer">
          <span className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm transition hover:border-[var(--accent)]">
            上传文件
          </span>
          <input type="file" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <ToolSection label="输入文本" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea
          value={input}
          onChange={(v) => {
            setInput(v)
            if (fileBuffer) {
              setFileBuffer(null)
              setOutput('')
            }
          }}
          placeholder="输入要哈希的文本"
          rows={6}
        />
      </ToolSection>

      {error && <Alert type="error">{error}</Alert>}

      <ToolSection label="SHA-256 结果" action={output ? <CopyButton text={output} /> : undefined}>
        <TextArea value={loading ? '计算中...' : output} readOnly rows={3} />
      </ToolSection>
    </ToolPanel>
  )
}
