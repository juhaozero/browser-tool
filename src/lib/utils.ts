import { useEffect, useState } from 'react'
import { readInitialDark, THEME_STORAGE_KEY } from '@/lib/theme'

/** 深色/浅色主题：无偏好时跟随系统，可手动切换并持久化 */
export function useTheme() {
  const [dark, setDark] = useState(readInitialDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light')
  }, [dark])

  // 用户未手动选择时，跟随系统主题变化
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return { dark, toggle: () => setDark((v) => !v) }
}

/** 写入剪贴板，失败时静默返回 false */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** 使用 Web Crypto 计算文本/文件哈希（SHA 系列） */
export async function hashText(algorithm: AlgorithmIdentifier, text: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(text)
  return crypto.subtle.digest(algorithm, data)
}

export async function hashFile(algorithm: AlgorithmIdentifier, file: File): Promise<ArrayBuffer> {
  const buffer = await file.arrayBuffer()
  return crypto.subtle.digest(algorithm, buffer)
}

export function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

export function formatJson(value: unknown, indent = 2): string {
  return JSON.stringify(value, null, indent)
}

export function generateUuidV4(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  // RFC 4122：设置 version(4) 与 variant 位
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function base64Encode(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

export function base64Decode(base64: string): string {
  const cleaned = base64.replace(/\s/g, '')
  if (!cleaned) throw new Error('Base64 不能为空')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) throw new Error('Base64 格式无效')
  const binary = atob(cleaned)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function unescapeHtml(text: string): string {
  const doc = new DOMParser().parseFromString(text, 'text/html')
  return doc.documentElement.textContent ?? ''
}

export function toCamelCase(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^./, (c) => c.toLowerCase())
}

export function toPascalCase(text: string): string {
  const camel = toCamelCase(text)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

export function toSnakeCase(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}

export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function toConstantCase(text: string): string {
  return toSnakeCase(text).toUpperCase()
}

/** 基于 LCS 的行级 diff，输出 unified diff 风格（+ 新增 / - 删除） */
export function simpleDiff(a: string, b: string): string {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const n = aLines.length
  const m = bLines.length

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) dp[i][j] = dp[i + 1][j + 1] + 1
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const result: string[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      result.push(` ${aLines[i]}`)
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push(`-${aLines[i]}`)
      i++
    } else {
      result.push(`+${bLines[j]}`)
      j++
    }
  }
  while (i < n) {
    result.push(`-${aLines[i++]}`)
  }
  while (j < m) {
    result.push(`+${bLines[j++]}`)
  }
  return result.join('\n')
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().replace(/^#/, '').match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360
  s /= 100
  l /= 100
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  }
}

import { BASE64URL_PART_RE } from '@/lib/input-validation'

/** 解码 JWT 单段（Header 或 Payload），Base64URL → JSON */
export function decodeJwtPart(part: string): unknown {
  if (!BASE64URL_PART_RE.test(part)) throw new Error('JWT 段格式无效')
  const padded = part.replace(/-/g, '+').replace(/_/g, '/')
  const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='))
  return JSON.parse(json)
}
