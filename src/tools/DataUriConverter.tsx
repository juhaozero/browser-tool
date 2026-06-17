import { useRef, useState } from 'react'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { downloadBlob } from '@/lib/download'

const EXAMPLE_DATA_URI =
  'data:text/plain;charset=utf-8,Hello%2C%20Browser%20Tool!%20%E8%BF%99%E6%98%AF%E4%B8%80%E6%9D%A1%E7%A4%BA%E4%BE%8B%E6%96%87%E6%9C%AC%E3%80%82'

export default function DataUriConverter() {
  const [input, setInput] = useState(EXAMPLE_DATA_URI)
  const [info, setInfo] = useState<{ mime: string; size: number; filename: string } | null>(null)
  const [error, setError] = useState('')
  const bytesRef = useRef<Uint8Array | null>(null)

  const parse = () => {
    setError('')
    setInfo(null)
    bytesRef.current = null
    const trimmed = input.trim()
    if (!trimmed.startsWith('data:')) {
      setError('无效的 Data URI，需以 data: 开头')
      return
    }
    try {
      const match = trimmed.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/s)
      if (!match) throw new Error('格式无效')
      const mime = match[1] || 'application/octet-stream'
      const isBase64 = !!match[2]
      const data = match[3]
      let bytes: Uint8Array
      if (isBase64) {
        const binary = atob(data)
        bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
      } else {
        bytes = new TextEncoder().encode(decodeURIComponent(data))
      }
      const ext = mime.split('/')[1]?.split('+')[0] || 'bin'
      setInfo({ mime, size: bytes.length, filename: `download.${ext}` })
      bytesRef.current = bytes
    } catch {
      setError('Data URI 解析失败')
    }
  }

  const download = () => {
    if (!info || !bytesRef.current) return
    downloadBlob(
      new Blob([Uint8Array.from(bytesRef.current)], { type: info.mime }),
      info.filename,
    )
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setInput(EXAMPLE_DATA_URI)} />
        <Button variant="primary" onClick={parse}>
          解析
        </Button>
        <Button onClick={download} disabled={!info}>
          下载文件
        </Button>
      </div>

      <ToolSection label="Data URI">
        <TextArea value={input} onChange={setInput} rows={6} placeholder="data:text/plain;charset=utf-8,Hello" />
      </ToolSection>

      {error && <Alert type="error">{error}</Alert>}

      {info && (
        <div className="grid gap-2 rounded-lg bg-[var(--bg-muted)] p-4 text-sm sm:grid-cols-3">
          <div><span className="text-[var(--text-muted)]">MIME：</span>{info.mime}</div>
          <div><span className="text-[var(--text-muted)]">大小：</span>{info.size} bytes</div>
          <div><span className="text-[var(--text-muted)]">文件名：</span>{info.filename}</div>
        </div>
      )}
    </ToolPanel>
  )
}
