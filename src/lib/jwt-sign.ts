/**
 * JWT HMAC 签名与验签（HS256 / HS384 / HS512）
 * 使用 Web Crypto API，密钥不出浏览器
 */

function base64UrlEncode(data: string | ArrayBuffer): string {
  const bytes =
    typeof data === 'string'
      ? new TextEncoder().encode(data)
      : new Uint8Array(data)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecodeToBuffer(part: string): ArrayBuffer {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function hashForAlg(alg: string): AlgorithmIdentifier {
  if (alg === 'HS384') return 'SHA-384'
  if (alg === 'HS512') return 'SHA-512'
  return 'SHA-256'
}

export async function signJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const alg = (header.alg as string) || 'HS256'
  const hashAlg = hashForAlg(alg)

  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: hashAlg },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))
  return `${signingInput}.${base64UrlEncode(sig)}`
}

export type JwtVerifyResult = {
  valid: boolean
  algorithm: string
  header: Record<string, unknown>
  payload: Record<string, unknown>
  expired?: boolean
  notBefore?: boolean
  message: string
}

/** 本地验签 JWT（仅 HMAC）；并检查可选的 exp / nbf */
export async function verifyJwt(token: string, secret: string): Promise<JwtVerifyResult> {
  const cleaned = token.trim().replace(/^Bearer\s+/i, '')
  const parts = cleaned.split('.')
  if (parts.length !== 3) {
    throw new Error('JWT 须包含 Header、Payload、Signature 三段')
  }
  if (!secret.trim()) throw new Error('请填写密钥')

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string]
  const header = JSON.parse(
    new TextDecoder().decode(base64UrlDecodeToBuffer(headerB64)),
  ) as Record<string, unknown>
  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlDecodeToBuffer(payloadB64)),
  ) as Record<string, unknown>

  const alg = String(header.alg ?? '')
  if (!/^HS(256|384|512)$/.test(alg)) {
    throw new Error(`暂不支持算法 ${alg || '(空)'}，仅支持 HS256 / HS384 / HS512`)
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: hashForAlg(alg) },
    false,
    ['verify'],
  )

  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const signature = base64UrlDecodeToBuffer(signatureB64)
  const valid = await crypto.subtle.verify('HMAC', key, signature, signingInput)

  const now = Math.floor(Date.now() / 1000)
  const exp = typeof payload.exp === 'number' ? payload.exp : undefined
  const nbf = typeof payload.nbf === 'number' ? payload.nbf : undefined
  const expired = exp !== undefined && now >= exp
  const notBefore = nbf !== undefined && now < nbf

  let message: string
  if (!valid) message = '签名无效'
  else if (expired) message = '签名有效，但 Token 已过期 (exp)'
  else if (notBefore) message = '签名有效，但尚未生效 (nbf)'
  else message = '签名有效'

  return { valid, algorithm: alg, header, payload, expired, notBefore, message }
}
