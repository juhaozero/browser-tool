import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { signJwt } from '@/lib/jwt-sign'

const EXAMPLE_HEADER = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}'
const EXAMPLE_PAYLOAD = '{\n  "sub": "1234567890",\n  "name": "张三",\n  "iat": 1516239022,\n  "exp": 1893456000\n}'
const EXAMPLE_SECRET = 'your-256-bit-secret'

export default function JwtGenerator() {
  const [algorithm, setAlgorithm] = useState('HS256')
  const [header, setHeader] = useState(EXAMPLE_HEADER)
  const [payload, setPayload] = useState(EXAMPLE_PAYLOAD)
  const [secret, setSecret] = useState(EXAMPLE_SECRET)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const loadExample = () => {
    setHeader(EXAMPLE_HEADER)
    setPayload(EXAMPLE_PAYLOAD)
    setSecret(EXAMPLE_SECRET)
    setAlgorithm('HS256')
  }

  const generate = async () => {
    setError('')
    try {
      const headerObj = JSON.parse(header) as Record<string, unknown>
      const payloadObj = JSON.parse(payload) as Record<string, unknown>
      headerObj.alg = algorithm
      headerObj.typ = headerObj.typ ?? 'JWT'
      if (!secret.trim()) throw new Error('请填写密钥')
      const result = await signJwt(headerObj, payloadObj, secret)
      setToken(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
      setToken('')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={loadExample} />
        <Select
          value={algorithm}
          onChange={setAlgorithm}
          options={[
            { value: 'HS256', label: 'HS256' },
            { value: 'HS384', label: 'HS384' },
            { value: 'HS512', label: 'HS512' },
          ]}
        />
        <Button variant="primary" onClick={generate}>
          生成 JWT
        </Button>
      </div>

      <ToolSection label="Header (JSON)">
        <TextArea value={header} onChange={setHeader} rows={4} />
      </ToolSection>

      <ToolSection label="Payload (JSON) — 支持 iss / sub / aud / exp / nbf / iat / jti 等标准声明">
        <TextArea value={payload} onChange={setPayload} rows={8} />
      </ToolSection>

      <ToolSection label="密钥 (Secret)">
        <Input value={secret} onChange={setSecret} placeholder="HMAC 密钥" />
      </ToolSection>

      {error && <Alert type="error">{error}</Alert>}

      {token && (
        <ToolSection label="生成的 Token" action={<CopyButton text={token} />}>
          <TextArea value={token} readOnly rows={4} />
        </ToolSection>
      )}

      <Alert type="info">仅支持 HMAC 算法（HS256/384/512），签名在本地完成。</Alert>
    </ToolPanel>
  )
}
