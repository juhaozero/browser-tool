import { useRef, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { aesDecrypt, aesEncrypt, parseAesEnvelope } from '@/lib/crypto-aes'
import { parseJsonObject } from '@/lib/input-validation'
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
  const opIdRef = useRef(0)

  const doEncrypt = async (plain: string, pwd: string) => {
    const opId = ++opIdRef.current
    setError('')
    try {
      if (!pwd) throw new Error('请填写密码')
      const envelope = await aesEncrypt(plain, pwd)
      if (opId !== opIdRef.current) return
      const json = formatJson(envelope)
      setOutput(json)
      setCiphertext(json)
    } catch (e) {
      if (opId !== opIdRef.current) return
      setError(e instanceof Error ? e.message : '加密失败')
    }
  }

  const doDecrypt = async (cipher: string, pwd: string) => {
    const opId = ++opIdRef.current
    setError('')
    try {
      if (!pwd) throw new Error('请填写密码')
      if (!cipher.trim()) throw new Error('请填写密文')
      const envelopeParsed = parseJsonObject(cipher, '密文')
      if (typeof envelopeParsed === 'string') throw new Error(envelopeParsed)
      const envelope = parseAesEnvelope(envelopeParsed)
      if (typeof envelope === 'string') throw new Error(envelope)
      const plain = await aesDecrypt(envelope, pwd)
      if (opId !== opIdRef.current) return
      setOutput(plain)
    } catch (e) {
      if (opId !== opIdRef.current) return
      setError(e instanceof Error ? e.message : '解密失败，请检查密文和密码')
    }
  }

  const handleEncrypt = () => {
    setMode('encrypt')
    void doEncrypt(plaintext, password)
  }

  const handleDecrypt = () => {
    setMode('decrypt')
    void doDecrypt(ciphertext, password)
  }

  const loadExample = () => {
    setPlaintext(EXAMPLE_PLAIN)
    setPassword(EXAMPLE_PASSWORD)
    setCiphertext('')
    setMode('encrypt')
    setOutput('')
    setError('')
    void doEncrypt(EXAMPLE_PLAIN, EXAMPLE_PASSWORD)
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={loadExample} />
        <Button variant={mode === 'encrypt' ? 'primary' : 'secondary'} onClick={handleEncrypt}>
          加密
        </Button>
        <Button variant={mode === 'decrypt' ? 'primary' : 'secondary'} onClick={handleDecrypt}>
          解密
        </Button>
      </div>

      <ToolSection label="密码">
        <Input value={password} onChange={setPassword} placeholder="加密密码" />
      </ToolSection>

      {mode === 'encrypt' ? (
        <ToolSection label="明文">
          <TextArea value={plaintext} onChange={setPlaintext} rows={6} mono={false} />
        </ToolSection>
      ) : (
        <ToolSection label="密文 (JSON)">
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
