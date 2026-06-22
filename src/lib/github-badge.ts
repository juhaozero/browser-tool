/**
 * GitHub README 徽章（shields.io）URL 与 Markdown 生成
 * 仅生成 https://img.shields.io 固定域名的链接，避免开放重定向
 */

import { isBlank, validateHttpUrl } from '@/lib/input-validation'

export const SHIELDS_BASE = 'https://img.shields.io/badge'
export const MAX_BADGE_FIELD_LENGTH = 64
export const MAX_BADGE_LOGO_LENGTH = 32

export const BADGE_STYLES = [
  { value: '', label: '默认 (flat)' },
  { value: 'flat', label: 'flat' },
  { value: 'flat-square', label: 'flat-square' },
  { value: 'plastic', label: 'plastic' },
  { value: 'for-the-badge', label: 'for-the-badge' },
  { value: 'social', label: 'social' },
] as const

export const BADGE_COLOR_PRESETS = [
  { value: 'brightgreen', label: '亮绿' },
  { value: 'green', label: '绿色' },
  { value: 'yellow', label: '黄色' },
  { value: 'orange', label: '橙色' },
  { value: 'red', label: '红色' },
  { value: 'blue', label: '蓝色' },
  { value: 'lightgray', label: '浅灰' },
  { value: 'lightgrey', label: '浅灰 (grey)' },
] as const

export interface BadgeOptions {
  label: string
  message: string
  color: string
  style?: string
  logo?: string
  logoColor?: string
  link?: string
}

/** shields.io 路径段编码：空格 → _，保留字转义 */
export function shieldsEncode(segment: string): string {
  return segment
    .trim()
    .replace(/-/g, '--')
    .replace(/_/g, '__')
    .replace(/\s+/g, '_')
}

function validateBadgeField(value: string, name: string): string | null {
  if (isBlank(value)) return `请填写${name}`
  if (value.length > MAX_BADGE_FIELD_LENGTH) {
    return `${name}不能超过 ${MAX_BADGE_FIELD_LENGTH} 个字符`
  }
  if (/[\r\n<>]/.test(value)) return `${name}不能包含换行或尖括号`
  return null
}

function validateColor(color: string): string | null {
  const trimmed = color.trim()
  if (!trimmed) return '请填写颜色'
  if (trimmed.length > 20) return '颜色值过长'
  if (!/^[a-zA-Z0-9#]+$/.test(trimmed)) {
    return '颜色仅支持字母、数字或 # 开头的十六进制'
  }
  return null
}

function validateLogo(logo: string): string | null {
  if (!logo.trim()) return null
  if (logo.length > MAX_BADGE_LOGO_LENGTH) return `Logo 名称不能超过 ${MAX_BADGE_LOGO_LENGTH} 个字符`
  if (!/^[a-zA-Z0-9_-]+$/.test(logo)) return 'Logo 仅支持字母、数字、连字符和下划线'
  return null
}

export function validateBadgeOptions(options: BadgeOptions): string | null {
  const labelErr = validateBadgeField(options.label, '标签')
  if (labelErr) return labelErr
  const messageErr = validateBadgeField(options.message, '内容')
  if (messageErr) return messageErr
  const colorErr = validateColor(options.color)
  if (colorErr) return colorErr
  const logoErr = validateLogo(options.logo ?? '')
  if (logoErr) return logoErr
  if (options.logoColor?.trim() && validateColor(options.logoColor)) {
    return 'Logo 颜色格式无效'
  }
  if (options.link?.trim()) {
    return validateHttpUrl(options.link.trim())
  }
  return null
}

export function buildShieldsBadgeUrl(options: BadgeOptions): string | null {
  const error = validateBadgeOptions(options)
  if (error) return null

  const color = options.color.trim().replace(/^#/, '')
  const path = [
    shieldsEncode(options.label),
    shieldsEncode(options.message),
    shieldsEncode(color),
  ].join('-')

  const url = new URL(`${SHIELDS_BASE}/${path}`)
  const style = options.style?.trim()
  if (style) url.searchParams.set('style', style)
  if (options.logo?.trim()) url.searchParams.set('logo', options.logo.trim())
  if (options.logoColor?.trim()) {
    url.searchParams.set('logoColor', options.logoColor.trim().replace(/^#/, ''))
  }
  if (options.link?.trim()) url.searchParams.set('link', options.link.trim())

  if (url.origin !== 'https://img.shields.io') return null
  return url.toString()
}

export function buildBadgeMarkdown(imageUrl: string, options: BadgeOptions): string {
  const alt = `${options.label.trim()} ${options.message.trim()}`.trim()
  const img = `![${alt}](${imageUrl})`
  const link = options.link?.trim()
  if (link && validateHttpUrl(link) === null) {
    return `[${img}](${link})`
  }
  return img
}

export function buildBadgeHtml(imageUrl: string, options: BadgeOptions): string {
  const alt = `${options.label.trim()} ${options.message.trim()}`.trim()
  const img = `<img src="${imageUrl}" alt="${escapeHtmlAttr(alt)}" />`
  const link = options.link?.trim()
  if (link && validateHttpUrl(link) === null) {
    return `<a href="${escapeHtmlAttr(link)}">${img}</a>`
  }
  return img
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
