import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { buildUrl, parseUrl } from '@/lib/url-parse'

const EXAMPLE = 'https://user:pass@example.com:8443/path/to?q=%E4%BD%A0%E5%A5%BD&page=1&tag=a&tag=b#section'

export default function UrlParser() {
  const [input, setInput] = useState('')
  const [rebuildError, setRebuildError] = useState('')

  const result = useMemo(() => {
    if (!input.trim()) return { parsed: null as ReturnType<typeof parseUrl> | null, error: '' }
    try {
      return { parsed: parseUrl(input), error: '' }
    } catch (e) {
      return { parsed: null, error: e instanceof Error ? e.message : '解析失败' }
    }
  }, [input])

  const queryText = result.parsed
    ? result.parsed.query.map((q) => `${q.key}=${q.value}`).join('\n')
    : ''

  const jsonText = result.parsed ? JSON.stringify(result.parsed, null, 2) : ''

  const fieldLines = result.parsed
    ? [
        `protocol: ${result.parsed.protocol}`,
        `origin: ${result.parsed.origin}`,
        `host: ${result.parsed.host}`,
        `hostname: ${result.parsed.hostname}`,
        `port: ${result.parsed.port || '(default)'}`,
        `pathname: ${result.parsed.pathname}`,
        `search: ${result.parsed.search || '(none)'}`,
        `hash: ${result.parsed.hash || '(none)'}`,
        `username: ${result.parsed.username || '(none)'}`,
        `password: ${result.parsed.password ? '(set)' : '(none)'}`,
        `href: ${result.parsed.href}`,
      ].join('\n')
    : ''

  const rebuild = () => {
    if (!result.parsed) return
    try {
      setRebuildError('')
      setInput(
        buildUrl({
          protocol: result.parsed.protocol,
          username: result.parsed.username,
          password: result.parsed.password,
          hostname: result.parsed.hostname,
          port: result.parsed.port,
          pathname: result.parsed.pathname,
          hash: result.parsed.hash,
          query: result.parsed.query,
        }),
      )
    } catch (e) {
      setRebuildError(e instanceof Error ? e.message : '重建失败')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton
          onClick={() => {
            setInput(EXAMPLE)
            setRebuildError('')
          }}
        />
        <Button onClick={rebuild} disabled={!result.parsed}>
          规范化重建
        </Button>
      </div>

      <ToolSection label="URL" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea
          value={input}
          onChange={(v) => {
            setInput(v)
            setRebuildError('')
          }}
          placeholder="https://example.com/path?q=1#hash"
          rows={3}
        />
      </ToolSection>

      {(result.error || rebuildError) && <Alert type="error">{result.error || rebuildError}</Alert>}

      {result.parsed && (
        <>
          <ToolSection label="组成部分" action={<CopyButton text={fieldLines} />}>
            <TextArea value={fieldLines} readOnly rows={11} />
          </ToolSection>

          <ToolSection
            label="Query 参数（每行 key=value）"
            action={queryText ? <CopyButton text={queryText} /> : undefined}
          >
            <TextArea
              value={queryText || '(无查询参数)'}
              readOnly
              rows={Math.min(8, Math.max(3, result.parsed.query.length + 1))}
            />
          </ToolSection>

          <ToolSection label="JSON" action={<CopyButton text={jsonText} />}>
            <TextArea value={jsonText} readOnly rows={12} />
          </ToolSection>
        </>
      )}
    </ToolPanel>
  )
}
