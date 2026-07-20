/**
 * NanoID / ULID / Hashids（本地实现，无第三方依赖）
 */

const NANOID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const HASHIDS_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

/** 生成 NanoID，默认 21 字符 */
export function generateNanoId(size = 21, alphabet = NANOID_ALPHABET): string {
  if (size < 1 || size > 128) throw new Error('长度须在 1–128 之间')
  if (alphabet.length < 2) throw new Error('字母表至少 2 个字符')
  const bytes = randomBytes(size)
  let id = ''
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i]! % alphabet.length]!
  }
  return id
}

function encodeTime(now: number, len: number): string {
  let str = ''
  for (let i = len; i > 0; i--) {
    const mod = now % ULID_ALPHABET.length
    str = ULID_ALPHABET[mod]! + str
    now = Math.floor(now / ULID_ALPHABET.length)
  }
  return str
}

function encodeRandom(len: number): string {
  let str = ''
  const bytes = randomBytes(len)
  for (let i = 0; i < len; i++) {
    str += ULID_ALPHABET[bytes[i]! % ULID_ALPHABET.length]!
  }
  return str
}

/** 生成 ULID（26 字符，可按时间排序） */
export function generateUlid(timestamp = Date.now()): string {
  return encodeTime(timestamp, 10) + encodeRandom(16)
}

function shuffle(alphabet: string, salt: string): string {
  if (!salt) return alphabet
  const chars = alphabet.split('')
  for (let i = chars.length - 1, v = 0, p = 0; i > 0; i--, v++) {
    v %= salt.length
    p += salt.charCodeAt(v)
    const j = (salt.charCodeAt(v) + v + p) % i
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join('')
}

function toAlphabet(input: number, alphabet: string): string {
  if (input === 0) return alphabet[0]!
  let id = ''
  let n = input
  const base = alphabet.length
  while (n > 0) {
    id = alphabet[n % base]! + id
    n = Math.floor(n / base)
  }
  return id
}

function fromAlphabet(input: string, alphabet: string): number {
  let n = 0
  const base = alphabet.length
  for (const ch of input) {
    const idx = alphabet.indexOf(ch)
    if (idx === -1) throw new Error('Hashid 含非法字符')
    n = n * base + idx
  }
  return n
}

/**
 * 简化版 Hashids：salt 打乱字母表；首字符作分隔符
 * 最小长度通过 `sep+sep` 后缀填充，解码时忽略填充段
 * （与官方 hashids 不完全兼容）
 */
export class Hashids {
  private digitAlphabet: string
  private separator: string
  private minLength: number

  constructor(salt = '', minLength = 0, alphabet = HASHIDS_ALPHABET) {
    if (alphabet.length < 3) throw new Error('字母表至少 3 个字符')
    const shuffled = shuffle(alphabet, salt)
    this.separator = shuffled[0]!
    this.digitAlphabet = shuffled.slice(1)
    this.minLength = Math.max(0, minLength)
  }

  encode(...numbers: number[]): string {
    if (numbers.length === 0) return ''
    for (const n of numbers) {
      if (!Number.isInteger(n) || n < 0) throw new Error('仅支持非负整数')
    }

    let result = numbers.map((n) => toAlphabet(n, this.digitAlphabet)).join(this.separator)
    if (result.length < this.minLength) {
      let pad = ''
      let i = 0
      while (result.length + 2 + pad.length < this.minLength) {
        pad += this.digitAlphabet[i % this.digitAlphabet.length]!
        i++
      }
      result = `${result}${this.separator}${this.separator}${pad}`
      if (result.length < this.minLength) {
        result += this.digitAlphabet[0]!.repeat(this.minLength - result.length)
      }
    }
    return result
  }

  decode(hash: string): number[] {
    if (!hash) return []
    const doubleSep = this.separator + this.separator
    const body = hash.includes(doubleSep) ? hash.slice(0, hash.indexOf(doubleSep)) : hash
    const parts = body.split(this.separator)
    if (parts.some((p) => p.length === 0)) throw new Error('无法解码 Hashid')
    return parts.map((p) => fromAlphabet(p, this.digitAlphabet))
  }
}
