import { useEffect, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { Input, ToolPanel, ToolSection } from '@/components/ui'
import { hslToRgb, parseHexColor, rgbToHsl } from '@/lib/utils'

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function applyColor(
  r: number,
  g: number,
  b: number,
  setHex: (v: string) => void,
  setRgb: (v: { r: number; g: number; b: number }) => void,
  setHsl: (v: { h: number; s: number; l: number }) => void,
) {
  setRgb({ r, g, b })
  setHex(rgbToHex(r, g, b))
  setHsl(rgbToHsl(r, g, b))
}

export default function ColorConverter() {
  const [hex, setHex] = useState('#0891b2')
  const [rgb, setRgb] = useState({ r: 8, g: 145, b: 178 })
  const [hsl, setHsl] = useState({ h: 192, s: 92, l: 36 })

  useEffect(() => {
    const parsed = parseHexColor(hex)
    if (!parsed) return
    setRgb(parsed)
    setHsl(rgbToHsl(parsed.r, parsed.g, parsed.b))
  }, [hex])

  const updateFromRgb = (key: 'r' | 'g' | 'b', value: number) => {
    const next = { ...rgb, [key]: Math.min(255, Math.max(0, value)) }
    applyColor(next.r, next.g, next.b, setHex, setRgb, setHsl)
  }

  const updateFromHsl = (key: 'h' | 's' | 'l', value: number) => {
    const next = {
      h: key === 'h' ? Math.min(360, Math.max(0, value)) : hsl.h,
      s: key === 's' ? Math.min(100, Math.max(0, value)) : hsl.s,
      l: key === 'l' ? Math.min(100, Math.max(0, value)) : hsl.l,
    }
    const rgbVal = hslToRgb(next.h, next.s, next.l)
    applyColor(rgbVal.r, rgbVal.g, rgbVal.b, setHex, setRgb, setHsl)
  }

  const pickerHex = rgbToHex(rgb.r, rgb.g, rgb.b)
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
              onChange={(e) => setHex(e.target.value)}
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
            onChange={(e) => updateFromHsl('h', Number(e.target.value))}
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
            onChange={(e) => updateFromHsl('s', Number(e.target.value))}
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
            onChange={(e) => updateFromHsl('l', Number(e.target.value))}
            className="color-slider w-full"
            style={{
              background: `linear-gradient(to right, #000, hsl(${hsl.h}, ${hsl.s}%, 50%), #fff)`,
            }}
          />
        </div>
      </div>

      <ToolSection label="HEX" action={<CopyButton text={hex} />}>
        <Input value={hex} onChange={setHex} placeholder="#0891b2" />
      </ToolSection>

      <div className="grid gap-3 sm:grid-cols-3">
        {(['r', 'g', 'b'] as const).map((key) => (
          <div key={key} className="space-y-1">
            <label className="text-sm uppercase text-[var(--text-muted)]">{key}</label>
            <Input
              value={String(rgb[key])}
              onChange={(v) => updateFromRgb(key, parseInt(v, 10) || 0)}
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
              value={String(hsl[key])}
              onChange={(v) => updateFromHsl(key, parseInt(v, 10) || 0)}
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
