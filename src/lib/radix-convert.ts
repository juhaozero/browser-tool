/**
 * 进制互转：二 / 八 / 十 / 十六进制
 */

export type Radix = 2 | 8 | 10 | 16

export interface RadixValues {
  bin: string
  oct: string
  dec: string
  hex: string
}

const RADIX_LABEL: Record<Radix, keyof RadixValues> = {
  2: 'bin',
  8: 'oct',
  10: 'dec',
  16: 'hex',
}

/** 解析用户输入为非负 BigInt；支持 0b/0o/0x 前缀与空白/下划线分隔 */
export function parseRadixInput(raw: string, radix: Radix): bigint {
  let text = raw.trim().replace(/[\s_]/g, '')
  if (!text) throw new Error('请输入数值')

  // 允许带前缀时自动识别，但仍按所选进制校验
  const lower = text.toLowerCase()
  if (lower.startsWith('0b')) {
    text = text.slice(2)
    if (radix !== 2) throw new Error('二进制前缀 0b 仅可用于二进制输入')
  } else if (lower.startsWith('0o')) {
    text = text.slice(2)
    if (radix !== 8) throw new Error('八进制前缀 0o 仅可用于八进制输入')
  } else if (lower.startsWith('0x')) {
    text = text.slice(2)
    if (radix !== 16) throw new Error('十六进制前缀 0x 仅可用于十六进制输入')
  }

  if (!text) throw new Error('请输入数值')

  const pattern =
    radix === 2
      ? /^[01]+$/
      : radix === 8
        ? /^[0-7]+$/
        : radix === 10
          ? /^\d+$/
          : /^[0-9a-fA-F]+$/

  if (!pattern.test(text)) {
    throw new Error(invalidMessage(radix))
  }

  try {
    return BigInt(radix === 10 ? text : `${prefixOf(radix)}${text}`)
  } catch {
    throw new Error('数值过大或格式无效')
  }
}

export function formatRadix(value: bigint, radix: Radix): string {
  if (value < 0n) throw new Error('暂不支持负数')
  const raw = value.toString(radix)
  return radix === 16 ? raw.toUpperCase() : raw
}

export function convertAllRadix(raw: string, from: Radix): RadixValues {
  const value = parseRadixInput(raw, from)
  return {
    bin: formatRadix(value, 2),
    oct: formatRadix(value, 8),
    dec: formatRadix(value, 10),
    hex: formatRadix(value, 16),
  }
}

export function radixKey(radix: Radix): keyof RadixValues {
  return RADIX_LABEL[radix]
}

function prefixOf(radix: Radix): string {
  if (radix === 2) return '0b'
  if (radix === 8) return '0o'
  if (radix === 16) return '0x'
  return ''
}

function invalidMessage(radix: Radix): string {
  switch (radix) {
    case 2:
      return '二进制仅允许 0/1'
    case 8:
      return '八进制仅允许 0–7'
    case 10:
      return '十进制仅允许 0–9'
    case 16:
      return '十六进制仅允许 0–9 / A–F'
  }
}
