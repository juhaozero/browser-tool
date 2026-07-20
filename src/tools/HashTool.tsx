import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SparkMD5 from 'spark-md5'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { bufferToBase64, bufferToHex, hashText } from '@/lib/utils'

const EXAMPLE = 'Hello, Browser Tool!'

type AlgoId = 'md5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
type OutputFormat = 'hex' | 'base64'

const ALGO_OPTIONS: { value: AlgoId; label: string }[] = [
  { value: 'md5', label: 'MD5' },
  { value: 'SHA-1', label: 'SHA-1' },
  { value: 'SHA-256', label: 'SHA-256' },
  { value: 'SHA-384', label: 'SHA-384' },
  { value: 'SHA-512', label: 'SHA-512' },
]

function parseAlgo(raw: string | null): AlgoId {
  if (!raw) return 'SHA-256'
  const normalized = raw.trim().toLowerCase()
  const map: Record<string, AlgoId> = {
    md5: 'md5',
    'sha-1': 'SHA-1',
    sha1: 'SHA-1',
    'sha-256': 'SHA-256',
    sha256: 'SHA-256',
    'sha-384': 'SHA-384',
    sha384: 'SHA-384',
    'sha-512': 'SHA-512',
    sha512: 'SHA-512',
  }
  return map[normalized] ?? 'SHA-256'
}

function hexToBase64(hex: string): string {
  const pairs = hex.match(/.{1,2}/g) ?? []
  const bytes = new Uint8Array(pairs.map((b) => parseInt(b, 16)))
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function formatBuffer(buffer: ArrayBuffer, fmt: OutputFormat): string {
  return fmt === 'hex' ? bufferToHex(buffer) : bufferToBase64(buffer)
}

function formatMd5Hex(hex: string, fmt: OutputFormat): string {
  return fmt === 'hex' ? hex : hexToBase64(hex)
}

/** 统一哈希工具：MD5 + SHA 系列，支持文本与文件 */
export default function HashTool() {
  const [searchParams, setSearchParams] = useSearchParams()
  const algo = parseAlgo(searchParams.get('algo'))
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [format, setFormat] = useState<OutputFormat>('hex')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  /** 上传文件的原始字节；有值时优先用文件内容计算 */
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)

  const digest = useCallback(
    async (text: string, nextAlgo: AlgoId, nextFormat: OutputFormat, buffer: ArrayBuffer | null) => {
      if (!buffer && !text.trim()) {
        throw new Error('请输入文本或上传文件')
      }
      if (nextAlgo === 'md5') {
        const hex = buffer ? SparkMD5.ArrayBuffer.hash(buffer) : SparkMD5.hash(text)
        return formatMd5Hex(hex, nextFormat)
      }
      const digestBuffer = buffer
        ? await crypto.subtle.digest(nextAlgo, buffer)
        : await hashText(nextAlgo, text)
      return formatBuffer(digestBuffer, nextFormat)
    },
    [],
  )

  const compute = async (
    text: string,
    nextAlgo: AlgoId = algo,
    nextFormat: OutputFormat = format,
    buffer: ArrayBuffer | null = fileBuffer,
  ) => {
    setLoading(true)
    setError('')
    try {
      setOutput(await digest(text, nextAlgo, nextFormat, buffer))
    } catch (e) {
      setError(e instanceof Error ? e.message : '哈希计算失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAlgoChange = (v: string) => {
    const next = v as AlgoId
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('algo', next === 'md5' ? 'md5' : next.toLowerCase())
        return nextParams
      },
      { replace: true },
    )
    if (fileBuffer || input.trim()) {
      void compute(input, next, format, fileBuffer)
    } else {
      setOutput('')
      setError('')
    }
  }

  const handleFormatChange = async (v: string) => {
    const next = v as OutputFormat
    setFormat(next)
    if (fileBuffer || input.trim()) {
      await compute(input, algo, next, fileBuffer)
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const raw = await file.arrayBuffer()
      setFileBuffer(raw)
      setInput(`[文件] ${file.name} (${file.size} bytes)`)
      setOutput(await digest('', algo, format, raw))
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件哈希失败')
    } finally {
      setLoading(false)
    }
  }

  const algoLabel = ALGO_OPTIONS.find((o) => o.value === algo)?.label ?? algo

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
        <Select value={algo} onChange={handleAlgoChange} options={ALGO_OPTIONS} />
        <Select
          value={format}
          onChange={handleFormatChange}
          options={[
            { value: 'hex', label: 'Hex 输出' },
            { value: 'base64', label: 'Base64 输出' },
          ]}
        />
        <Button
          variant="primary"
          onClick={() => compute(input)}
          disabled={loading || (!input.trim() && !fileBuffer)}
        >
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

      <ToolSection
        label={`${algoLabel} 结果`}
        action={output ? <CopyButton text={output} /> : undefined}
      >
        <TextArea value={loading ? '计算中...' : output} readOnly rows={3} />
      </ToolSection>
    </ToolPanel>
  )
}
