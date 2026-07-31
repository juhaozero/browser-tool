import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Select, ToolPanel, ToolSection } from '@/components/ui'
import { downloadBlob, downloadText } from '@/lib/download'
import {
  assertRasterImageFile,
  imageToIcoFile,
  imageToSvg,
} from '@/lib/image-utils'

const SPEED_OPTIONS = [
  { value: 'low', label: '快速（低质量插值）' },
  { value: 'medium', label: '均衡' },
  { value: 'high', label: '高质量（较慢）' },
]

const ICO_SIZE_PRESETS: { value: string; label: string; sizes: number[] }[] = [
  { value: '16', label: '16 × 16', sizes: [16] },
  { value: '32', label: '32 × 32', sizes: [32] },
  { value: '48', label: '48 × 48', sizes: [48] },
  { value: '64', label: '64 × 64', sizes: [64] },
  { value: '128', label: '128 × 128', sizes: [128] },
  { value: '256', label: '256 × 256', sizes: [256] },
  { value: 'multi', label: '多尺寸 (16/32/48)', sizes: [16, 32, 48] },
  { value: 'favicon', label: 'Favicon 常用 (16/32/48/64)', sizes: [16, 32, 48, 64] },
]

type TargetFormat = 'ico' | 'svg'

/**
 * PNG / JPG → 真正的 .ico，或内嵌位图的 .svg
 */
export default function ImageToIcoSvg() {
  const [target, setTarget] = useState<TargetFormat>('ico')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 })
  const [icoPreset, setIcoPreset] = useState('32')
  const [svgMax, setSvgMax] = useState('0')
  const [embedMime, setEmbedMime] = useState<'image/png' | 'image/jpeg'>('image/png')
  const [speed, setSpeed] = useState('high')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const previewUrlRef = useRef('')

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      assertRasterImageFile(f)
    } catch (err) {
      setError(err instanceof Error ? err.message : '请选择 PNG 或 JPG')
      return
    }
    setFile(f)
    setError('')
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(f)
    previewUrlRef.current = url
    setPreview(url)
    const img = new Image()
    img.onload = () => setOriginalSize({ w: img.width, h: img.height })
    img.onerror = () => setError('图片加载失败')
    img.src = url
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const convert = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const base = file.name.replace(/\.[^.]+$/, '') || 'image'
      const quality = speed as ImageSmoothingQuality
      if (target === 'ico') {
        const preset = ICO_SIZE_PRESETS.find((p) => p.value === icoPreset) ?? ICO_SIZE_PRESETS[1]
        const blob = await imageToIcoFile(file, preset.sizes, quality)
        await downloadBlob(blob, `${base}.ico`)
      } else {
        const maxSize = parseInt(svgMax, 10)
        const svg = await imageToSvg(file, {
          maxSize: maxSize > 0 ? maxSize : undefined,
          embedMime,
          smoothingQuality: quality,
        })
        await downloadText(svg, `${base}.svg`, 'image/svg+xml')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={target === 'ico' ? 'primary' : 'secondary'}
          onClick={() => setTarget('ico')}
        >
          转为 ICO
        </Button>
        <Button
          variant={target === 'svg' ? 'primary' : 'secondary'}
          onClick={() => setTarget('svg')}
        >
          转为 SVG
        </Button>
      </div>

      <label className="cursor-pointer">
        <span className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm hover:border-[var(--accent)]">
          选择 PNG / JPG
        </span>
        <input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" className="hidden" onChange={onFile} />
      </label>

      {preview && (
        <div className="space-y-2">
          <img
            src={preview}
            alt="preview"
            className="max-h-48 rounded-lg border border-[var(--border)]"
          />
          {originalSize.w > 0 && (
            <p className="text-sm text-[var(--text-muted)]">
              原始尺寸：{originalSize.w} × {originalSize.h}
            </p>
          )}
        </div>
      )}

      {target === 'ico' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ToolSection label="图标尺寸">
            <Select
              value={icoPreset}
              onChange={setIcoPreset}
              options={ICO_SIZE_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
            />
          </ToolSection>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-muted)]">缩放质量</label>
            <Select value={speed} onChange={setSpeed} options={SPEED_OPTIONS} />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <ToolSection label="最大边长 (px)">
            <Select
              value={svgMax}
              onChange={setSvgMax}
              options={[
                { value: '0', label: '保持原尺寸' },
                { value: '128', label: '128' },
                { value: '256', label: '256' },
                { value: '512', label: '512' },
                { value: '1024', label: '1024' },
              ]}
            />
          </ToolSection>
          <ToolSection label="内嵌格式">
            <Select
              value={embedMime}
              onChange={(v) => setEmbedMime(v as 'image/png' | 'image/jpeg')}
              options={[
                { value: 'image/png', label: 'PNG（保留透明）' },
                { value: 'image/jpeg', label: 'JPEG（体积更小）' },
              ]}
            />
          </ToolSection>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-[var(--text-muted)]">缩放质量</label>
            <Select value={speed} onChange={setSpeed} options={SPEED_OPTIONS} />
          </div>
        </div>
      )}

      <Button variant="primary" onClick={convert} disabled={!file || loading}>
        {loading ? '转换中...' : target === 'ico' ? '下载 .ico' : '下载 .svg'}
      </Button>

      {error && <Alert type="error">{error}</Alert>}

      <Alert type="info">
        {target === 'ico'
          ? '输出标准 ICO 文件（内嵌 PNG），可多尺寸打包，适合网站 favicon 与桌面图标。'
          : 'SVG 以内嵌 Base64 位图方式生成（非 AI 矢量化描摹），可在网页中按矢量容器缩放显示。'}
      </Alert>
    </ToolPanel>
  )
}
