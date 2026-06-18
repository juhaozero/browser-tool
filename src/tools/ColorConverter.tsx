import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { Alert, Input, ToolPanel, ToolSection } from '@/components/ui'
import { hslToRgb, parseHexColor, rgbToHsl } from '@/lib/utils'

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function clampChannel(value: string, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(max, Math.max(0, Math.round(n)))
}

export default function ColorConverter() {
  const [hex, setHex] = useState('#0891b2')
  const [rgb, setRgb] = useState({ r: 8, g: 145, b: 178 })
  const [hsl, setHsl] = useState({ h: 192, s: 92, l: 36 })
  const [rgbText, setRgbText] = useState({ r: '8', g: '145', b: '178' })
  const [hslText, setHslText] = useState({ h: '192', s: '92', l: '36' })
  const [hexError, setHexError] = useState('')

  const applyParsedHex = (parsed: { r: number; g: number; b: number }) => {
    setRgb(parsed)
    setRgbText({ r: String(parsed.r), g: String(parsed.g), b: String(parsed.b) })
    const hslVal = rgbToHsl(parsed.r, parsed.g, parsed.b)
    setHsl(hslVal)
    setHslText({ h: String(hslVal.h), s: String(hslVal.s), l: String(hslVal.l) })
    setHexError('')
  }

  const syncFromRgb = (r: number, g: number, b: number) => {
    const nextHex = rgbToHex(r, g, b)
    setHex(nextHex)
    applyParsedHex({ r, g, b })
  }

  const commitHex = (value: string) => {
    const parsed = parseHexColor(value)
    if (!parsed) {
      if (value.trim() !== '') setHexError('无效的 HEX 颜色，请输入 #RGB 或 #RRGGBB')
      return
    }
    setHex(rgbToHex(parsed.r, parsed.g, parsed.b))
    applyParsedHex(parsed)
  }

  const updateFromRgbText = (key: 'r' | 'g' | 'b', value: string) => {
    setRgbText((prev) => ({ ...prev, [key]: value }))
    if (value.trim() === '' || !Number.isFinite(Number(value))) return
    const next = { ...rgb, [key]: clampChannel(value, 255) }
    syncFromRgb(next.r, next.g, next.b)
  }

  const commitRgbText = (key: 'r' | 'g' | 'b') => {
    const value = rgbText[key]
    if (value.trim() === '' || !Number.isFinite(Number(value))) {
      setRgbText((prev) => ({ ...prev, [key]: String(rgb[key]) }))
      return
    }
    const next = { ...rgb, [key]: clampChannel(value, 255) }
    syncFromRgb(next.r, next.g, next.b)
  }

  const updateFromHslText = (key: 'h' | 's' | 'l', value: string) => {
    setHslText((prev) => ({ ...prev, [key]: value }))
    if (value.trim() === '' || !Number.isFinite(Number(value))) return
    const max = key === 'h' ? 360 : 100
    const next = {
      h: key === 'h' ? clampChannel(value, max) : hsl.h,
      s: key === 's' ? clampChannel(value, max) : hsl.s,
      l: key === 'l' ? clampChannel(value, max) : hsl.l,
    }
    const rgbVal = hslToRgb(next.h, next.s, next.l)
    syncFromRgb(rgbVal.r, rgbVal.g, rgbVal.b)
  }

  const commitHslText = (key: 'h' | 's' | 'l') => {
    const value = hslText[key]
    if (value.trim() === '' || !Number.isFinite(Number(value))) {
      setHslText((prev) => ({ ...prev, [key]: String(hsl[key]) }))
      return
    }
    const max = key === 'h' ? 360 : 100
    const next = { ...hsl, [key]: clampChannel(value, max) }
    const rgbVal = hslToRgb(next.h, next.s, next.l)
    syncFromRgb(rgbVal.r, rgbVal.g, rgbVal.b)
  }

  const pickerHex = parseHexColor(hex) ? hex : rgbToHex(rgb.r, rgb.g, rgb.b)
  const cssRgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  const cssHsl = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`

  return (
    <ToolPanel className="space-y-4">
      <ToolSection label="色盘">
        <div className="flex flex-wrap items-center gap-5">
          <label className="group relative cursor-pointer">
            <span
              className="pointer-events-none absolute -inset-1 rounded-full opacity-0 blur transition group-hover:opacity-100"
              style={{ backgroundColor: pickerHex }}
            />
            <input
              type="color"
              value={pickerHex}
              onChange={(e) => commitHex(e.target.value)}
              aria-label="选择颜色"
              className="color-picker-swatch relative h-20 w-20 shrink-0 cursor-pointer rounded-full border-2 border-[var(--border)] shadow-sm transition hover:scale-105 hover:border-[var(--accent)]"
            />
          </label>

          <div className="min-w-0 flex-1 space-y-3">
            <div
              className="h-14 rounded-xl border border-[var(--border)] shadow-inner"
              style={{ backgroundColor: pickerHex }}
            />
            <p className="text-sm text-[var(--text-muted)]">
              点击色盘打开取色器，或在下方微调色相、饱和度与明度
            </p>
          </div>
        </div>
      </ToolSection>

      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">色相 (H)</span>
            <span className="font-mono">{hsl.h}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={hsl.h}
            onChange={(e) => updateFromHslText('h', e.target.value)}
            className="color-slider color-slider-hue w-full"
            style={{
              background:
                'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">饱和度 (S)</span>
            <span className="font-mono">{hsl.s}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={hsl.s}
            onChange={(e) => updateFromHslText('s', e.target.value)}
            className="color-slider w-full"
            style={{
              background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`,
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">明度 (L)</span>
            <span className="font-mono">{hsl.l}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={hsl.l}
            onChange={(e) => updateFromHslText('l', e.target.value)}
            className="color-slider w-full"
            style={{
              background: `linear-gradient(to right, #000, hsl(${hsl.h}, ${hsl.s}%, 50%), #fff)`,
            }}
          />
        </div>
      </div>

      <ToolSection label="HEX" action={<CopyButton text={hex} />}>
        <Input
          value={hex}
          onChange={setHex}
          onBlur={() => commitHex(hex)}
          placeholder="#0891b2"
        />
      </ToolSection>

      {hexError && <Alert type="error">{hexError}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        {(['r', 'g', 'b'] as const).map((key) => (
          <div key={key} className="space-y-1">
            <label className="text-sm uppercase text-[var(--text-muted)]">{key}</label>
            <Input
              value={rgbText[key]}
              onChange={(v) => updateFromRgbText(key, v)}
              onBlur={() => commitRgbText(key)}
              type="number"
            />
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(['h', 's', 'l'] as const).map((key) => (
          <div key={key} className="space-y-1">
            <label className="text-sm uppercase text-[var(--text-muted)]">{key}</label>
            <Input
              value={hslText[key]}
              onChange={(v) => updateFromHslText(key, v)}
              onBlur={() => commitHslText(key)}
              type="number"
            />
          </div>
        ))}
      </div>

      <div className="grid gap-2 rounded-lg bg-[var(--bg-muted)] p-4 text-sm font-mono">
        <div className="flex items-center justify-between">
          <span>{cssRgb}</span>
          <CopyButton text={cssRgb} />
        </div>
        <div className="flex items-center justify-between">
          <span>{cssHsl}</span>
          <CopyButton text={cssHsl} />
        </div>
      </div>

      <style>{`
        .color-picker-swatch {
          padding: 0;
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
        }
        .color-picker-swatch::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        .color-picker-swatch::-webkit-color-swatch {
          border: none;
          border-radius: 9999px;
        }
        .color-picker-swatch::-moz-color-swatch {
          border: none;
          border-radius: 9999px;
        }
        .color-slider {
          height: 12px;
          appearance: none;
          -webkit-appearance: none;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
        }
        .color-slider::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
          background: var(--thumb-color, #fff);
          cursor: grab;
        }
        .color-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
          background: var(--thumb-color, #fff);
          cursor: grab;
        }
      `}</style>
    </ToolPanel>
  )
}
