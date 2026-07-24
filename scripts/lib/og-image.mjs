/**
 * OG 分享图模板（1200×630）
 * SVG 生成 + 可选 Resvg 栅格化为 PNG（需本机 CJK 字体）
 */
import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { ROOT, escapeXml } from './site-env.mjs'

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630
export const OG_DIR_NAME = 'og'

function wrapText(text, maxCharsPerLine, maxLines) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim()
  if (!raw) return []
  const lines = []
  let rest = raw
  while (rest && lines.length < maxLines) {
    if (rest.length <= maxCharsPerLine) {
      lines.push(rest)
      break
    }
    let cut = maxCharsPerLine
    // 尽量在空格/标点处断行
    const slice = rest.slice(0, maxCharsPerLine + 1)
    const breakAt = Math.max(
      slice.lastIndexOf(' '),
      slice.lastIndexOf('，'),
      slice.lastIndexOf('。'),
      slice.lastIndexOf('、'),
      slice.lastIndexOf('/'),
      slice.lastIndexOf('-'),
    )
    if (breakAt > maxCharsPerLine * 0.45) cut = breakAt + (slice[breakAt] === ' ' ? 0 : 1)
    let line = rest.slice(0, cut).trim()
    rest = rest.slice(cut).trim()
    if (lines.length === maxLines - 1 && rest) {
      line = `${line.replace(/[…\.]*$/, '')}…`
      rest = ''
    }
    lines.push(line)
  }
  return lines
}

/** 构建 OG SVG 字符串 */
export function buildOgSvg({
  eyebrow = 'BROWSER TOOL',
  title,
  description = '',
  footer = '本地运行 · 隐私优先',
}) {
  const titleLines = wrapText(title, 18, 2)
  const descLines = wrapText(description, 32, 3)
  const titleFontSize = titleLines.join('').length > 16 ? 52 : 60
  const titleStartY = 250
  const titleTspans = titleLines
    .map((line, i) => {
      const y = titleStartY + i * (titleFontSize + 12)
      return `<tspan x="72" y="${y}">${escapeXml(line)}</tspan>`
    })
    .join('')

  const descStartY = titleStartY + titleLines.length * (titleFontSize + 12) + 36
  const descTspans = descLines
    .map((line, i) => {
      const y = descStartY + i * 34
      return `<tspan x="72" y="${y}">${escapeXml(line)}</tspan>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1220"/>
      <stop offset="55%" stop-color="#102033"/>
      <stop offset="100%" stop-color="#0e7490"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="45%">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#glow)"/>
  <circle cx="1080" cy="120" r="180" fill="#22d3ee" fill-opacity="0.08"/>
  <circle cx="980" cy="520" r="220" fill="#0891b2" fill-opacity="0.12"/>
  <rect x="0" y="0" width="14" height="${OG_HEIGHT}" fill="url(#accent)"/>
  <text x="72" y="120" fill="#67e8f9" font-size="22" font-family="Segoe UI, Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif" letter-spacing="4">${escapeXml(eyebrow)}</text>
  <text fill="#f8fafc" font-size="${titleFontSize}" font-weight="700" font-family="Segoe UI, Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif">${titleTspans}</text>
  ${
    descTspans
      ? `<text fill="#94a3b8" font-size="26" font-family="Segoe UI, Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif">${descTspans}</text>`
      : ''
  }
  <rect x="72" y="540" width="64" height="6" rx="3" fill="url(#accent)"/>
  <text x="152" y="548" fill="#cbd5e1" font-size="22" font-family="Segoe UI, Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif">${escapeXml(footer)}</text>
</svg>`
}

async function pathExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/** 查找可用于 CJK 渲染的字体文件 */
export async function resolveOgFontPath() {
  if (process.env.OG_FONT_PATH && (await pathExists(process.env.OG_FONT_PATH))) {
    return process.env.OG_FONT_PATH
  }

  const local = path.join(ROOT, 'scripts', 'assets', 'fonts')
  const localCandidates = [
    path.join(local, 'NotoSansSC-Bold.otf'),
    path.join(local, 'NotoSansSC-Regular.otf'),
    path.join(local, 'NotoSansSC.ttc'),
  ]

  const winDir = process.env.WINDIR || 'C:\\Windows'
  const systemCandidates = [
    path.join(winDir, 'Fonts', 'msyhbd.ttc'),
    path.join(winDir, 'Fonts', 'msyh.ttc'),
    path.join(winDir, 'Fonts', 'simhei.ttf'),
    path.join(winDir, 'Fonts', 'simsun.ttc'),
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
    '/System/Library/Fonts/PingFang.ttc',
    '/System/Library/Fonts/STHeiti Light.ttc',
  ]

  for (const candidate of [...localCandidates, ...systemCandidates]) {
    if (await pathExists(candidate)) return candidate
  }
  return null
}

export async function renderOgPng(svg, fontPath) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_WIDTH },
    font: fontPath
      ? {
          fontFiles: [fontPath],
          loadSystemFonts: false,
          defaultFontFamily: 'sans-serif',
        }
      : {
          loadSystemFonts: true,
        },
  })
  return resvg.render().asPng()
}

/**
 * 写出 OG 资源：始终写 SVG；有字体时额外写 PNG
 * @returns {{ svgPath: string, pngPath: string | null, relativeSvg: string, relativePng: string | null }}
 */
export async function writeOgAssets(outDir, fileBase, payload, fontPath) {
  await mkdir(outDir, { recursive: true })
  const svg = buildOgSvg(payload)
  const svgPath = path.join(outDir, `${fileBase}.svg`)
  await writeFile(svgPath, svg, 'utf8')

  let pngPath = null
  if (fontPath) {
    try {
      const png = await renderOgPng(svg, fontPath)
      pngPath = path.join(outDir, `${fileBase}.png`)
      await writeFile(pngPath, png)
    } catch (err) {
      console.warn(`OG PNG 生成失败（${fileBase}）:`, err instanceof Error ? err.message : err)
      pngPath = null
    }
  }

  return {
    svgPath,
    pngPath,
    relativeSvg: `${OG_DIR_NAME}/${fileBase}.svg`,
    relativePng: pngPath ? `${OG_DIR_NAME}/${fileBase}.png` : null,
  }
}

export function ogPublicUrl(origin, basePath, relativePath) {
  const base = basePath === '/' ? '/' : basePath
  return `${origin}${base}${relativePath.replace(/^\/+/, '')}`
}
