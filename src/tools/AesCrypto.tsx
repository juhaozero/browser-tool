import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { aesDecrypt, aesEncrypt } from '@/lib/crypto-aes'
import { formatJson } from '@/lib/utils'

const EXAMPLE_PLAIN = 'Hello, Browser Tool! 这是一条机密消息。'
const EXAMPLE_PASSWORD = 'my-secret-password'

export default function AesCrypto() {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [plaintext, setPlaintext] = useState(EXAMPLE_PLAIN)
  const [password, setPassword] = useState(EXAMPLE_PASSWORD)
  const [ciphertext, setCiphertext] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const loadExample = () => {
    setPlaintext(EXAMPLE_PLAIN)
    setPassword(EXAMPLE_PASSWORD)
    setCiphertext('')
    setOutput('')
    setMode('encrypt')
  }

  const encrypt = async () => {
    setError('')
    try {
      if (!password) throw new Error('请填写密码')
      const envelope = await aesEncrypt(plaintext, password)
      const json = formatJson(envelope)
      setOutput(json)
      setCiphertext(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加密失败')
    }
  }

  const decrypt = async () => {
    setError('')
    try {
      if (!password) throw new Error('请填写密码')
      const envelope = JSON.parse(ciphertext || output)
      const plain = await aesDecrypt(envelope, password)
      setOutput(plain)
    } catch {
      setError('解密失败，请检查密文和密码')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={loadExample} />
        <Button variant={mode === 'encrypt' ? 'primary' : 'secondary'} onClick={() => setMode('encrypt')}>
          加密
        </Button>
        <Button variant={mode === 'decrypt' ? 'primary' : 'secondary'} onClick={() => setMode('decrypt')}>
          解密
        </Button>
        <Button variant="primary" onClick={mode === 'encrypt' ? encrypt : decrypt}>
          {mode === 'encrypt' ? '执行加密' : '执行解密'}
        </Button>
      </div>

      <ToolSection label="密码">
        <Input value={password} onChange={setPassword} placeholder="加密密码" type="password" />
      </ToolSection>

      {mode === 'encrypt' ? (
        <ToolSection label="明文">
          <TextArea value={plaintext} onChange={setPlaintext} rows={6} mono={false} />
        </ToolSection>
      ) : (
        <ToolSection label="密文 (JSON 信封)">
          <TextArea value={ciphertext} onChange={setCiphertext} rows={8} placeholder='{"salt":"...","iv":"...","ciphertext":"..."}' />
        </ToolSection>
      )}

      {error && <Alert type="error">{error}</Alert>}

      {output && (
        <ToolSection label="输出" action={<CopyButton text={output} />}>
          <TextArea value={output} readOnly rows={mode === 'encrypt' ? 8 : 6} />
        </ToolSection>
      )}

      <Alert type="info">使用 AES-256-GCM + PBKDF2（100000 次迭代）在本地加解密。</Alert>
    </ToolPanel>
  )
}
