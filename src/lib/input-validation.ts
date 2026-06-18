/** 通用输入校验，供各工具在处理/网络请求前早返回 */

export function isBlank(value: string): boolean {
  return value.trim() === ''
}

export function parseIntInRange(
  value: string,
  min: number,
  max: number,
  label: string,
): { ok: true; value: number } | { ok: false; error: string } {
  const n = Number(value)
  if (!Number.isInteger(n) || n < min || n > max) {
    return { ok: false, error: `${label}须在 ${min}–${max} 之间的整数` }
  }
  return { ok: true, value: n }
}

export function parseOptionalIntInRange(
  value: string,
  min: number,
  max: number,
  label: string,
): { ok: true; value: number | undefined } | { ok: false; error: string } {
  if (isBlank(value)) return { ok: true, value: undefined }
  const result = parseIntInRange(value, min, max, label)
  if (!result.ok) return result
  return { ok: true, value: result.value }
}

export const BASE64_RE = /^[A-Za-z0-9+/=\s]*$/
export const BASE64URL_PART_RE = /^[A-Za-z0-9_-]+$/
export const REGEX_FLAGS_RE = /^[gimsuy]*$/

export const MAX_IMAGE_DIMENSION = 16384
export const MAX_DATA_URI_LENGTH = 10 * 1024 * 1024
export const MAX_QR_TEXT_LENGTH = 2900

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseJsonObject(text: string, label: string): Record<string, unknown> | string {
  const trimmed = text.trim()
  if (!trimmed) return `请填写 ${label}`
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (!isJsonObject(parsed)) return `${label} 必须是 JSON 对象`
    return parsed
  } catch {
    return `${label} JSON 格式无效`
  }
}

export function validateNumericTimestamp(value: string, label: string): number | string {
  const trimmed = value.trim()
  if (!trimmed) return `请输入${label}`
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return `${label}只能包含数字`
  const num = Number(trimmed)
  if (!Number.isFinite(num)) return `请输入有效的${label}`
  return num
}

export function validateHttpUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'URL 须以 http:// 或 https:// 开头'
    }
    return null
  } catch {
    return 'URL 格式无效'
  }
}
