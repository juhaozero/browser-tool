import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Button, Input, Select, ToolPanel, ToolSection } from '@/components/ui'
import { downloadBlob } from '@/lib/download'
import { convertImageFormat, computeOutputDimensions, validateImageDimensions } from '@/lib/image-utils'
import {
  MAX_IMAGE_DIMENSION,
  parseIntInRange,
  parseOptionalIntInRange,
} from '@/lib/input-validation'

/** 缩放插值档位，映射到 Canvas imageSmoothingQuality */
const SPEED_OPTIONS = [
  { value: 'low', label: '快速（低质量插值）' },
  { value: 'medium', label: '均衡' },
  { value: 'high', label: '高质量（较慢）' },
]

type FormatId = 'png' | 'jpg' | 'webp' | 'avif' | 'ico'

interface FormatPreset {
  id: FormatId
  label: string
  mime: string
  ext: string
  supportsQuality: boolean
  defaultQuality: number
}

const FORMAT_PRESETS: FormatPreset[] = [
  { id: 'png', label: 'PNG', mime: 'image/png', ext: 'png', supportsQuality: false, defaultQuality: 92 },
  { id: 'jpg', label: 'JPG', mime: 'image/jpeg', ext: 'jpg', supportsQuality: true, defaultQuality: 90 },
  { id: 'webp', label: 'WebP', mime: 'image/webp', ext: 'webp', supportsQuality: true, defaultQuality: 85 },
  { id: 'avif', label: 'AVIF', mime: 'image/avif', ext: 'avif', supportsQuality: true, defaultQuality: 80 },
  { id: 'ico', label: 'Favicon (PNG)', mime: 'image/png', ext: 'png', supportsQuality: false, defaultQuality: 92 },
]

const FORMAT_OPTIONS = FORMAT_PRESETS.map((f) => ({
  value: f.id,
  label: f.id === 'ico' ? 'Favicon' : f.label,
}))

function parseFormat(raw: string | null): FormatId {
  if (!raw) return 'png'
  const normalized = raw.trim().toLowerCase()
  const map: Record<string, FormatId> = {
    png: 'png',
    jpg: 'jpg',
    jpeg: 'jpg',
    webp: 'webp',
    avif: 'avif',
    ico: 'ico',
    favicon: 'ico',
  }
  return map[normalized] ?? 'png'
}

/**
 * 统一图片格式转换：PNG / JPG / WebP / AVIF / Favicon
 * 支持 ?format=webp 等深链预选
 */
export default function ImageFormatConverter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const formatId = parseFormat(searchParams.get('format'))
  const preset = FORMAT_PRESETS.find((f) => f.id === formatId) ?? FORMAT_PRESETS[0]

  const handleFormatChange = (v: string) => {
    const next = v as FormatId
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('format', next)
        return nextParams
      },
      { replace: true },
    )
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[10rem] space-y-1">
          <label className="text-sm text-[var(--text-muted)]">目标格式</label>
          <Select value={formatId} onChange={handleFormatChange} options={FORMAT_OPTIONS} />
        </div>
        <p className="pb-2 text-sm text-[var(--text-muted)]">
          {formatId === 'ico'
            ? '生成 PNG 格式 favicon（浏览器原生 ICO 编码较复杂，此处输出 PNG）。'
            : `将图片转换为 ${preset.label}，支持质量、缩放与编码速度调节，全部在本地处理。`}
        </p>
      </div>

      {formatId === 'ico' ? <FaviconConverter /> : <RasterConverter key={formatId} preset={preset} />}
    </ToolPanel>
  )
}

function RasterConverter({ preset }: { preset: FormatPreset }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 })
  const [scalePercent, setScalePercent] = useState('100')
  const [maxWidth, setMaxWidth] = useState('')
  const [maxHeight, setMaxHeight] = useState('')
  const [quality, setQuality] = useState(String(preset.defaultQuality))
  const [speed, setSpeed] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const previewUrlRef = useRef('')

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    setFile(f)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(f)
    previewUrlRef.current = url
    setPreview(url)
    setError('')
    const img = new Image()
    img.onload = () => {
      try {
        validateImageDimensions(img.width, img.height)
        setOriginalSize({ w: img.width, h: img.height })
      } catch (err) {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = ''
        setPreview('')
        setFile(null)
        setOriginalSize({ w: 0, h: 0 })
        setError(err instanceof Error ? err.message : '图片尺寸无效')
      }
    }
    img.onerror = () => setError('图片加载失败')
    img.src = url
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const outputSize = () => {
    if (!originalSize.w) return null
    const scale = parseInt(scalePercent, 10) || 100
    const mw = maxWidth ? parseInt(maxWidth, 10) : undefined
    const mh = maxHeight ? parseInt(maxHeight, 10) : undefined
    return computeOutputDimensions(originalSize.w, originalSize.h, {
      scalePercent: scale,
      maxWidth: mw && mw > 0 ? mw : undefined,
      maxHeight: mh && mh > 0 ? mh : undefined,
    })
  }

  const convert = async () => {
    if (!file) return
    const scaleParsed = parseIntInRange(scalePercent, 10, 200, '缩放比例')
    if (!scaleParsed.ok) {
      setError(scaleParsed.error)
      return
    }
    const maxWidthParsed = parseOptionalIntInRange(maxWidth, 1, MAX_IMAGE_DIMENSION, '最大宽度')
    if (!maxWidthParsed.ok) {
      setError(maxWidthParsed.error)
      return
    }
    const maxHeightParsed = parseOptionalIntInRange(maxHeight, 1, MAX_IMAGE_DIMENSION, '最大高度')
    if (!maxHeightParsed.ok) {
      setError(maxHeightParsed.error)
      return
    }
    let qualityValue: number | undefined
    if (preset.supportsQuality) {
      const qualityParsed = parseIntInRange(quality, 10, 100, '输出质量')
      if (!qualityParsed.ok) {
        setError(qualityParsed.error)
        return
      }
      qualityValue = qualityParsed.value / 100
    }
    setLoading(true)
    setError('')
    try {
      const blob = await convertImageFormat(file, preset.mime, {
        quality: qualityValue,
        scalePercent: scaleParsed.value,
        maxWidth: maxWidthParsed.value,
        maxHeight: maxHeightParsed.value,
        smoothingQuality: speed as ImageSmoothingQuality,
      })
      downloadBlob(blob, `${file.name.replace(/\.[^.]+$/, '')}.${preset.ext}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换失败，当前浏览器可能不支持该格式')
    } finally {
      setLoading(false)
    }
  }

  const size = outputSize()

  return (
    <div className="space-y-4">
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

        {preset.supportsQuality && (
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
        {loading ? '转换中...' : `转换为 ${preset.label}`}
      </Button>

      {error && <Alert type="error">{error}</Alert>}
    </div>
  )
}

function FaviconConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [iconSize, setIconSize] = useState('32')
  const [speed, setSpeed] = useState('high')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const previewUrlRef = useRef('')

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    setFile(f)
    setError('')
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(f)
    previewUrlRef.current = url
    setPreview(url)
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
      const { imageToIco } = await import('@/lib/image-utils')
      const size = parseInt(iconSize, 10) || 32
      const blob = await imageToIco(file, size, speed as ImageSmoothingQuality)
      downloadBlob(blob, `favicon-${size}.png`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '图标生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
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
      {error && <Alert type="error">{error}</Alert>}
    </div>
  )
}
