import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { bufferToHex, parsePem, summarizeCertificate } from '@/lib/pem-parse'

/** 结构示例（占位 DER，演示多块 PEM 解析） */
const EXAMPLE = `-----BEGIN PUBLIC KEY-----
aGVsbG8gd29ybGQgcHVibGljIGtleQ==
-----END PUBLIC KEY-----

-----BEGIN CERTIFICATE-----
aGVsbG8gY2VydGlmaWNhdGUgcGxhY2Vob2xkZXI=
-----END CERTIFICATE-----`

export default function PemViewer() {
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (!input.trim()) return { blocks: [] as ReturnType<typeof parsePem>, error: '' }
    try {
      return { blocks: parsePem(input), error: '' }
    } catch (e) {
      return { blocks: [], error: e instanceof Error ? e.message : '解析失败' }
    }
  }, [input])

  return (
    <ToolPanel className="space-y-4">
      <ExampleButton onClick={() => setInput(EXAMPLE)} label="示例结构" />

      <ToolSection label="PEM 内容" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea
          value={input}
          onChange={setInput}
          placeholder={'-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'}
          rows={12}
        />
      </ToolSection>

      {result.error && <Alert type="error">{result.error}</Alert>}

      {result.blocks.map((block, index) => {
        const isCert = /CERTIFICATE/i.test(block.label) && !/REQUEST/i.test(block.label)
        const summary = isCert ? summarizeCertificate(block.der) : null
        const summaryText = summary
          ? [
              summary.subject && `Subject: ${summary.subject}`,
              summary.issuer && `Issuer: ${summary.issuer}`,
              summary.serialHex && `Serial: ${summary.serialHex}`,
              summary.notBefore && `Not Before: ${summary.notBefore}`,
              summary.notAfter && `Not After: ${summary.notAfter}`,
              summary.signatureAlgorithm && `Sig Alg: ${summary.signatureAlgorithm}`,
              summary.sans?.length && `SAN: ${summary.sans.join(', ')}`,
            ]
              .filter(Boolean)
              .join('\n')
          : ''

        return (
          <div key={`${block.label}-${index}`} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium text-[var(--text)]">
                {block.label} #{index + 1}
              </h3>
              <span className="text-xs text-[var(--text-muted)]">DER {block.derLength} bytes</span>
            </div>

            {summaryText ? (
              <ToolSection label="证书摘要" action={<CopyButton text={summaryText} />}>
                <TextArea value={summaryText} readOnly rows={6} />
              </ToolSection>
            ) : (
              isCert && <Alert type="info">未能完整解析证书字段（示例或非标准 DER 时常见）</Alert>
            )}

            <ToolSection
              label="DER Hex（前 256 字节）"
              action={<CopyButton text={bufferToHex(block.der.subarray(0, 256))} />}
            >
              <TextArea value={bufferToHex(block.der.subarray(0, 256))} readOnly rows={6} />
            </ToolSection>
          </div>
        )
      })}

      <Alert type="info">私钥与证书仅在浏览器本地解析，不会上传。</Alert>
    </ToolPanel>
  )
}
