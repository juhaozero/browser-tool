import { useMemo } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { BASE64URL_PART_RE } from '@/lib/input-validation'
import { decodeJwtPart, formatJson } from '@/lib/utils'
import { useToolDraft } from '@/hooks/useToolDraft'

const EXAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

export default function JwtDecoder() {
  const [input, setInput] = useToolDraft('jwt-decoder', 'input', '', { queryParam: 'token' })

  const result = useMemo(() => {
    if (!input.trim()) return { header: '', payload: '', error: '' }
    try {
      const parts = input.trim().replace(/^Bearer\s+/i, '').split('.')
      if (parts.length < 2) throw new Error('JWT 格式无效，至少需要 Header 和 Payload 两部分')
      if (!parts.every((part) => BASE64URL_PART_RE.test(part))) {
        throw new Error('JWT 格式无效，各段须为 Base64URL 字符')
      }
      const header = formatJson(decodeJwtPart(parts[0]))
      const payload = formatJson(decodeJwtPart(parts[1]))
      return { header, payload, error: '' }
    } catch (e) {
      return { header: '', payload: '', error: e instanceof Error ? e.message : '解析失败' }
    }
  }, [input])

  return (
    <ToolPanel className="space-y-4">
      <ExampleButton onClick={() => setInput(EXAMPLE_JWT)} />
      <ToolSection label="JWT Token" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea
          value={input}
          onChange={setInput}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          rows={4}
        />
      </ToolSection>

      {result.error ? (
        <Alert type="error">{result.error}</Alert>
      ) : (
        <>
          {result.header && (
            <ToolSection label="Header" action={<CopyButton text={result.header} />}>
              <TextArea value={result.header} readOnly rows={6} />
            </ToolSection>
          )}
          {result.payload && (
            <ToolSection label="Payload" action={<CopyButton text={result.payload} />}>
              <TextArea value={result.payload} readOnly rows={10} />
            </ToolSection>
          )}
        </>
      )}

      <Alert type="info">此工具仅解码 JWT 内容，不进行签名验证。请勿在公共环境粘贴敏感 Token。</Alert>
    </ToolPanel>
  )
}
