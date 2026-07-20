/**
 * PEM / 证书查看：解析 PEM 块，证书做轻量 ASN.1 字段提取
 */

export type PemBlock = {
  label: string
  der: Uint8Array
  derLength: number
  base64: string
}

export type CertSummary = {
  subject?: string
  issuer?: string
  serialHex?: string
  notBefore?: string
  notAfter?: string
  sans?: string[]
  signatureAlgorithm?: string
}

const PEM_RE = /-----BEGIN ([^-]+)-----([\s\S]*?)-----END \1-----/g

export function parsePem(input: string): PemBlock[] {
  const blocks: PemBlock[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(PEM_RE.source, 'g')
  while ((match = re.exec(input)) !== null) {
    const label = match[1]!.trim()
    const b64 = match[2]!.replace(/\s+/g, '')
    if (!b64) continue
    const binary = atob(b64)
    const der = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) der[i] = binary.charCodeAt(i)
    blocks.push({ label, der, derLength: der.length, base64: b64 })
  }
  if (blocks.length === 0) throw new Error('未找到有效的 PEM 块（-----BEGIN ...-----）')
  return blocks
}

function readAsn1Length(data: Uint8Array, offset: number): { length: number; headerLen: number } {
  const first = data[offset]!
  if (first < 0x80) return { length: first, headerLen: 1 }
  const n = first & 0x7f
  let length = 0
  for (let i = 0; i < n; i++) length = (length << 8) | data[offset + 1 + i]!
  return { length, headerLen: 1 + n }
}

function decodeOid(bytes: Uint8Array): string {
  if (bytes.length === 0) return ''
  const parts: number[] = [Math.floor(bytes[0]! / 40), bytes[0]! % 40]
  let value = 0
  for (let i = 1; i < bytes.length; i++) {
    value = (value << 7) | (bytes[i]! & 0x7f)
    if ((bytes[i]! & 0x80) === 0) {
      parts.push(value)
      value = 0
    }
  }
  return parts.join('.')
}

function decodePrintable(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  } catch {
    return Array.from(bytes)
      .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.'))
      .join('')
  }
}

type Asn1Node = { tag: number; value: Uint8Array; children?: Asn1Node[] }

function parseAsn1(data: Uint8Array, offset = 0, end = data.length): { node: Asn1Node; next: number } {
  if (offset >= end) throw new Error('ASN.1 越界')
  const tag = data[offset]!
  const { length, headerLen } = readAsn1Length(data, offset + 1)
  const valueStart = offset + 1 + headerLen
  const valueEnd = valueStart + length
  if (valueEnd > end) throw new Error('ASN.1 长度无效')
  const value = data.subarray(valueStart, valueEnd)
  const constructed = (tag & 0x20) !== 0
  const node: Asn1Node = { tag, value }
  if (constructed) {
    node.children = []
    let pos = 0
    while (pos < value.length) {
      const child = parseAsn1(value, pos, value.length)
      node.children.push(child.node)
      pos = child.next
    }
  }
  return { node, next: valueEnd }
}

const ATTR_OID: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '1.2.840.113549.1.9.1': 'emailAddress',
}

const SIG_OID: Record<string, string> = {
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
}

function nameFromRdnSequence(node?: Asn1Node): string | undefined {
  if (!node?.children) return undefined
  const parts: string[] = []
  for (const rdn of node.children) {
    const atav = rdn.children?.[0]
    const oidNode = atav?.children?.[0]
    const valueNode = atav?.children?.[1]
    if (!oidNode || !valueNode) continue
    const oid = decodeOid(oidNode.value)
    const key = ATTR_OID[oid] ?? oid
    parts.push(`${key}=${decodePrintable(valueNode.value)}`)
  }
  return parts.length ? parts.join(', ') : undefined
}

function parseUtcTime(bytes: Uint8Array): string {
  const s = decodePrintable(bytes)
  // YYMMDDHHMMSSZ
  if (/^\d{12}Z$/.test(s)) {
    const yy = Number(s.slice(0, 2))
    const year = yy >= 50 ? 1900 + yy : 2000 + yy
    return `${year}-${s.slice(2, 4)}-${s.slice(4, 6)}T${s.slice(6, 8)}:${s.slice(8, 10)}:${s.slice(10, 12)}Z`
  }
  if (/^\d{14}Z$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}Z`
  }
  return s
}

function findSans(extensions?: Asn1Node): string[] | undefined {
  if (!extensions?.children) return undefined
  const sans: string[] = []
  for (const ext of extensions.children) {
    const oid = ext.children?.[0] ? decodeOid(ext.children[0].value) : ''
    if (oid !== '2.5.29.17') continue
    // extnValue is OCTET STRING wrapping GeneralNames
    const octet = ext.children?.find((c) => c.tag === 0x04) ?? ext.children?.[ext.children.length - 1]
    if (!octet) continue
    try {
      const inner = parseAsn1(octet.value).node
      for (const gn of inner.children ?? []) {
        // dNSName [2] IA5String
        if ((gn.tag & 0x1f) === 2) sans.push(decodePrintable(gn.value))
        // iPAddress [7]
        if ((gn.tag & 0x1f) === 7 && gn.value.length === 4) {
          sans.push(Array.from(gn.value).join('.'))
        }
      }
    } catch {
      // ignore
    }
  }
  return sans.length ? sans : undefined
}

/** 从 DER 证书提取常用字段（失败时返回空对象） */
export function summarizeCertificate(der: Uint8Array): CertSummary {
  try {
    const root = parseAsn1(der).node
    const cert = root.children?.[0]
    if (!cert?.children) return {}

    // TBSCertificate fields vary with optional version
    let idx = 0
    if (cert.children[0] && (cert.children[0].tag & 0xc0) === 0xa0) idx = 1
    const serial = cert.children[idx]
    const sigAlg = cert.children[idx + 1]
    const issuer = cert.children[idx + 2]
    const validity = cert.children[idx + 3]
    const subject = cert.children[idx + 4]
    const extensionsContainer = cert.children.find((c) => (c.tag & 0x1f) === 3)

    const summary: CertSummary = {
      serialHex: serial
        ? Array.from(serial.value)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(':')
        : undefined,
      issuer: nameFromRdnSequence(issuer),
      subject: nameFromRdnSequence(subject),
    }

    const times = validity?.children
    if (times?.[0]) summary.notBefore = parseUtcTime(times[0].value)
    if (times?.[1]) summary.notAfter = parseUtcTime(times[1].value)

    const sigOidNode = sigAlg?.children?.[0]
    if (sigOidNode) {
      const oid = decodeOid(sigOidNode.value)
      summary.signatureAlgorithm = SIG_OID[oid] ?? oid
    }

    const extSeq = extensionsContainer?.children?.[0]
    summary.sans = findSans(extSeq)

    return summary
  } catch {
    return {}
  }
}

export function bufferToHex(bytes: Uint8Array, group = 16): string {
  const lines: string[] = []
  for (let i = 0; i < bytes.length; i += group) {
    const slice = bytes.subarray(i, i + group)
    const hex = Array.from(slice)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
    lines.push(hex)
  }
  return lines.join('\n')
}
