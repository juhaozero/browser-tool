import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Input, ToolPanel, ToolSection } from '@/components/ui'
import { downloadBlob } from '@/lib/download'
import { loadImage } from '@/lib/image-utils'

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [width, setWidth] = useState('800')
  const [height, setHeight] = useState('600')
  const [keepAspect, setKeepAspect] = useState(true)
  const [format, setFormat] = useState('image/png')
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewUrlRef = useRef('')

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError('')
    try {
      const img = await loadImage(f)
      setWidth(String(img.width))
      setHeight(String(img.height))
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      const url = URL.createObjectURL(f)
      previewUrlRef.current = url
      setPreview(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : '图片加载失败')
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const resize = async () => {
    if (!file || !canvasRef.current) return
    setError('')
    try {
      const img = await loadImage(file)
      let w = parseInt(width, 10) || img.width
      let h = parseInt(height, 10) || img.height
      if (keepAspect) {
        const ratio = Math.min(w / img.width, h / img.height)
        w = Math.round(img.width * ratio)
        h = Math.round(img.height * ratio)
      }
      const canvas = canvasRef.current
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, w, h)
      }
      ctx.drawImage(img, 0, 0, w, h)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('缩放失败'))), format, 0.92)
      })
      const ext = format.split('/')[1]
      downloadBlob(blob, `resized.${ext}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '缩放失败')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <label className="cursor-pointer">
        <span className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm hover:border-[var(--accent)]">
          选择图片
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>

      {preview && (
        <img src={preview} alt="preview" className="max-h-48 rounded-lg border border-[var(--border)]" />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <ToolSection label="宽度 (px)">
          <Input value={width} onChange={setWidth} type="number" />
        </ToolSection>
        <ToolSection label="高度 (px)">
          <Input value={height} onChange={setHeight} type="number" />
        </ToolSection>
        <div className="flex items-end gap-2 pb-1">
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)} />
            保持比例
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['image/png', 'image/jpeg', 'image/webp'] as const).map((f) => (
          <Button key={f} variant={format === f ? 'primary' : 'secondary'} onClick={() => setFormat(f)}>
            {f.split('/')[1].toUpperCase()}
          </Button>
        ))}
        <Button variant="primary" onClick={resize} disabled={!file}>
          缩放并下载
        </Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <canvas ref={canvasRef} className="hidden" />
    </ToolPanel>
  )
}
