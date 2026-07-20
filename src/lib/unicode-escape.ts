/** Unicode / Escape 互转 */

export type EscapeMode = 'unicode' | 'unicode-braced' | 'hex' | 'js-string' | 'html-decimal' | 'html-hex'

/** 将文本转义为所选格式 */
export function escapeText(input: string, mode: EscapeMode): string {
  if (mode === 'js-string') {
    return JSON.stringify(input)
  }

  let out = ''
  for (const ch of input) {
    const cp = ch.codePointAt(0)!
    switch (mode) {
      case 'unicode':
        out += cp > 0xffff
          ? `\\u{${cp.toString(16)}}`
          : `\\u${cp.toString(16).padStart(4, '0')}`
        break
      case 'unicode-braced':
        out += `\\u{${cp.toString(16)}}`
        break
      case 'hex':
        out += [...new TextEncoder().encode(ch)].map((b) => `\\x${b.toString(16).padStart(2, '0')}`).join('')
        break
      case 'html-decimal':
        out += `&#${cp};`
        break
      case 'html-hex':
        out += `&#x${cp.toString(16)};`
        break
      default:
        out += ch
    }
  }
  return out
}

/** 将转义序列还原为文本 */
export function unescapeText(input: string, mode: EscapeMode): string {
  if (mode === 'js-string') {
    const trimmed = input.trim()
    try {
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return JSON.parse(trimmed.startsWith("'") ? `"${trimmed.slice(1, -1).replace(/"/g, '\\"')}"` : trimmed)
      }
      return JSON.parse(`"${trimmed.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    } catch {
      // fall through to generic
    }
  }

  if (mode === 'html-decimal' || mode === 'html-hex' || mode === 'js-string') {
    return input
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
  }

  if (mode === 'hex') {
    return input.replace(/\\x([0-9a-fA-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
  }

  return input
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
}

/** 列出每个码点的详情 */
export function inspectCodePoints(input: string): { char: string; codePoint: string; utf8: string }[] {
  return [...input].map((char) => {
    const cp = char.codePointAt(0)!
    const utf8 = [...new TextEncoder().encode(char)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
    return {
      char,
      codePoint: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
      utf8,
    }
  })
}
