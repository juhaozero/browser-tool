import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { downloadDataUrl } from '@/lib/download'
import { MAX_QR_TEXT_LENGTH, parseIntInRange } from '@/lib/input-validation'

const EXAMPLE_TEXT = 'https://github.com'

export default function QrCodeGenerator() {
  const [text, setText] = useState(EXAMPLE_TEXT)
  const [size, setSize] = useState('256')
  const [margin, setMargin] = useState('2')
  const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [darkColor, setDarkColor] = useState('#000000')
  const [lightColor, setLightColor] = useState('#ffffff')
  const [dataUrl, setDataUrl] = useState('')
  const [asyncError, setAsyncError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const validationError = useMemo(() => {
    if (!text.trim()) return ''
    if (text.length > MAX_QR_TEXT_LENGTH) {
      return `内容过长（超过 ${MAX_QR_TEXT_LENGTH} 字符），无法生成二维码`
    }
    const sizeParsed = parseIntInRange(size, 64, 2048, '尺寸')
    if (!sizeParsed.ok) return sizeParsed.error
    const marginParsed = parseIntInRange(margin, 0, 10, '边距')
    if (!marginParsed.ok) return marginParsed.error
    return ''
  }, [text, size, margin])

  const qrOptions = useMemo(() => {
    if (validationError || !text.trim()) return null
    const sizeParsed = parseIntInRange(size, 64, 2048, '尺寸')
    const marginParsed = parseIntInRange(margin, 0, 10, '边距')
    if (!sizeParsed.ok || !marginParsed.ok) return null
    return {
      width: sizeParsed.value,
      margin: marginParsed.value,
      errorCorrectionLevel: ecLevel,
      color: { dark: darkColor, light: lightColor },
    }
  }, [validationError, text, size, margin, ecLevel, darkColor, lightColor])

  useEffect(() => {
    if (!qrOptions) return
    let cancelled = false
    QRCode.toDataURL(text, qrOptions)
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url)
          setAsyncError('')
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setDataUrl('')
          setAsyncError(e instanceof Error ? e.message : '二维码生成失败')
        }
      })
    return () => {
      cancelled = true
    }
  }, [text, qrOptions])

  const error = validationError || (qrOptions ? asyncError : '')
  const visibleDataUrl = qrOptions ? dataUrl : ''

  const download = () => {
    if (visibleDataUrl) downloadDataUrl(visibleDataUrl, 'qrcode.png')
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setText(EXAMPLE_TEXT)} />
        <Button variant="primary" onClick={download} disabled={!visibleDataUrl}>
          下载 PNG
        </Button>
      </div>

      <ToolSection label="内容" action={<CopyButton text={text} label="复制" />}>
        <TextArea value={text} onChange={setText} placeholder="URL、文本、Wi-Fi 配置等" rows={4} mono={false} />
      </ToolSection>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">尺寸 (px)</label>
          <Input value={size} onChange={setSize} type="number" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">边距</label>
          <Input value={margin} onChange={setMargin} type="number" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">纠错级别</label>
          <Select
            value={ecLevel}
            onChange={(v) => setEcLevel(v as 'L' | 'M' | 'Q' | 'H')}
            options={[
              { value: 'L', label: 'L (7%)' },
              { value: 'M', label: 'M (15%)' },
              { value: 'Q', label: 'Q (25%)' },
              { value: 'H', label: 'H (30%)' },
            ]}
          />
        </div>
        <div className="flex gap-2">
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-muted)]">前景色</label>
            <input type="color" value={darkColor} onChange={(e) => setDarkColor(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-muted)]">背景色</label>
            <input type="color" value={lightColor} onChange={(e) => setLightColor(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg" />
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {visibleDataUrl && (
        <div className="flex justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-6">
          <img src={visibleDataUrl} alt="QR Code" className="max-w-full" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </ToolPanel>
  )
}
