import { useState } from 'react'
import { Alert, Button, Input, Select, ToolPanel, ToolSection } from '@/components/ui'
import { downloadBlob } from '@/lib/download'
import { convertImageFormat } from '@/lib/image-utils'

interface ImageConverterProps {
  mime: string
  ext: string
  label: string
  defaultQuality?: number
  supportsQuality?: boolean
}

const SPEED_OPTIONS = [
  { value: 'low', label: '快速（低质量插值）' },
  { value: 'medium', label: '均衡' },
  { value: 'high', label: '高质量（较慢）' },
]

export default function ImageConverter({
  mime,
  ext,
  label,
  defaultQuality = 92,
  supportsQuality = true,
}: ImageConverterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 })
  const [scalePercent, setScalePercent] = useState('100')
  const [maxWidth, setMaxWidth] = useState('')
  const [maxHeight, setMaxHeight] = useState('')
  const [quality, setQuality] = useState(String(defaultQuality))
  const [speed, setSpeed] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
    const img = new Image()
    img.onload = () => setOriginalSize({ w: img.width, h: img.height })
    img.src = URL.createObjectURL(f)
  }

  const outputSize = () => {
    if (!originalSize.w) return null
    const scale = (parseInt(scalePercent, 10) || 100) / 100
    let w = Math.round(originalSize.w * scale)
    let h = Math.round(originalSize.h * scale)
    const mw = maxWidth ? parseInt(maxWidth, 10) : 0
    const mh = maxHeight ? parseInt(maxHeight, 10) : 0
    if (mw && w > mw) {
      h = Math.round((h * mw) / w)
      w = mw
    }
    if (mh && h > mh) {
      w = Math.round((w * mh) / h)
      h = mh
    }
    return { w, h }
  }

  const convert = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const blob = await convertImageFormat(file, mime, {
        quality: supportsQuality ? (parseInt(quality, 10) || defaultQuality) / 100 : undefined,
        scalePercent: parseInt(scalePercent, 10) || 100,
        maxWidth: maxWidth ? parseInt(maxWidth, 10) : undefined,
        maxHeight: maxHeight ? parseInt(maxHeight, 10) : undefined,
        smoothingQuality: speed as ImageSmoothingQuality,
      })
      downloadBlob(blob, `${file.name.replace(/\.[^.]+$/, '')}.${ext}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '转换失败，当前浏览器可能不支持该格式')
    } finally {
      setLoading(false)
    }
  }

  const size = outputSize()

  return (
    <ToolPanel className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        将图片转换为 {label} 格式，支持质量、缩放比例与编码速度调节，全部在本地处理。
      </p>

      <label className="cursor-pointer">
        <span className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm hover:border-[var(--accent)]">
          选择图片
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>

      {preview && (
        <div className="space-y-2">
          <img src={preview} alt="preview" className="max-h-48 rounded-lg border border-[var(--border)]" />
          {originalSize.w > 0 && (
            <p className="text-sm text-[var(--text-muted)]">
              原始尺寸：{originalSize.w} × {originalSize.h}
              {size && ` → 输出约 ${size.w} × ${size.h}`}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">缩放比例</span>
            <span className="font-mono">{scalePercent}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            value={scalePercent}
            onChange={(e) => setScalePercent(e.target.value)}
            className="w-full"
          />
        </div>

        {supportsQuality && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">输出质量</span>
              <span className="font-mono">{quality}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        <ToolSection label="最大宽度 (px，可选)">
          <Input value={maxWidth} onChange={setMaxWidth} type="number" placeholder="不限制" />
        </ToolSection>

        <ToolSection label="最大高度 (px，可选)">
          <Input value={maxHeight} onChange={setMaxHeight} type="number" placeholder="不限制" />
        </ToolSection>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm text-[var(--text-muted)]">缩放/编码速度</label>
          <Select value={speed} onChange={setSpeed} options={SPEED_OPTIONS} />
          <p className="text-xs text-[var(--text-muted)]">
            快速模式使用低质量插值，适合预览；高质量模式缩放更平滑但耗时更长。
          </p>
        </div>
      </div>

      <Button variant="primary" onClick={convert} disabled={!file || loading}>
        {loading ? '转换中...' : `转换为 ${label}`}
      </Button>

      {error && <Alert type="error">{error}</Alert>}
    </ToolPanel>
  )
}

export function ImageToPng() {
  return <ImageConverter mime="image/png" ext="png" label="PNG" supportsQuality={false} />
}

export function ImageToJpg() {
  return <ImageConverter mime="image/jpeg" ext="jpg" label="JPG" defaultQuality={90} />
}

export function ImageToWebp() {
  return <ImageConverter mime="image/webp" ext="webp" label="WebP" defaultQuality={85} />
}

export function ImageToAvif() {
  return <ImageConverter mime="image/avif" ext="avif" label="AVIF" defaultQuality={80} />
}

export function ImageToIco() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [iconSize, setIconSize] = useState('32')
  const [speed, setSpeed] = useState('high')
  const [loading, setLoading] = useState(false)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const convert = async () => {
    if (!file) return
    setLoading(true)
    const { imageToIco } = await import('@/lib/image-utils')
    const size = parseInt(iconSize, 10) || 32
    const blob = await imageToIco(file, size, speed as ImageSmoothingQuality)
    downloadBlob(blob, `favicon-${size}.png`)
    setLoading(false)
  }

  return (
    <ToolPanel className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">生成网站 favicon 图标，支持尺寸与缩放质量调节。</p>
      <label className="cursor-pointer">
        <span className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm hover:border-[var(--accent)]">
          选择图片
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {preview && <img src={preview} alt="preview" className="max-h-48 rounded-lg border border-[var(--border)]" />}

      <div className="grid gap-3 sm:grid-cols-2">
        <ToolSection label="图标尺寸 (px)">
          <Select
            value={iconSize}
            onChange={setIconSize}
            options={[
              { value: '16', label: '16 × 16' },
              { value: '32', label: '32 × 32' },
              { value: '48', label: '48 × 48' },
              { value: '64', label: '64 × 64' },
              { value: '128', label: '128 × 128' },
            ]}
          />
        </ToolSection>
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">缩放质量</label>
          <Select value={speed} onChange={setSpeed} options={SPEED_OPTIONS} />
        </div>
      </div>

      <Button variant="primary" onClick={convert} disabled={!file || loading}>
        {loading ? '生成中...' : '生成图标'}
      </Button>
    </ToolPanel>
  )
}
