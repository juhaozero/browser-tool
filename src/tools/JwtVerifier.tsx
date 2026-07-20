import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { verifyJwt } from '@/lib/jwt-sign'
import { formatJson } from '@/lib/utils'

const EXAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
const EXAMPLE_SECRET = 'your-256-bit-secret'

export default function JwtVerifier() {
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'warn' | 'fail'>('idle')
  const [message, setMessage] = useState('')

  const verify = async () => {
    setError('')
    try {
      const result = await verifyJwt(token, secret)
      setHeader(formatJson(result.header))
      setPayload(formatJson(result.payload))
      setMessage(result.message)
      if (!result.valid) setStatus('fail')
      else if (result.expired || result.notBefore) setStatus('warn')
      else setStatus('ok')
    } catch (e) {
      setStatus('fail')
      setHeader('')
      setPayload('')
      setMessage('')
      setError(e instanceof Error ? e.message : '验签失败')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton
          onClick={() => {
            setToken(EXAMPLE_JWT)
            setSecret(EXAMPLE_SECRET)
            setError('')
            setStatus('idle')
            setHeader('')
            setPayload('')
            setMessage('')
          }}
        />
        <Button variant="primary" onClick={() => void verify()}>
          验证签名
        </Button>
      </div>

      <ToolSection label="JWT Token" action={<CopyButton text={token} label="复制输入" />}>
        <TextArea value={token} onChange={setToken} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." rows={4} />
      </ToolSection>

      <ToolSection label="密钥 (Secret)">
        <Input value={secret} onChange={setSecret} placeholder="HMAC 密钥" />
      </ToolSection>

      {error && <Alert type="error">{error}</Alert>}
      {status === 'ok' && <Alert type="success">{message}</Alert>}
      {status === 'warn' && <Alert type="info">{message}</Alert>}
      {status === 'fail' && message && <Alert type="error">{message}</Alert>}

      {header && (
        <ToolSection label="Header" action={<CopyButton text={header} />}>
          <TextArea value={header} readOnly rows={5} />
        </ToolSection>
      )}
      {payload && (
        <ToolSection label="Payload" action={<CopyButton text={payload} />}>
          <TextArea value={payload} readOnly rows={8} />
        </ToolSection>
      )}

      <Alert type="info">仅支持 HS256 / HS384 / HS512 本地验签；RSA / ECDSA 暂不支持。</Alert>
    </ToolPanel>
  )
}
