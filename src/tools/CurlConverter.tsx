import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { curlToFetch, curlToGo, curlToPython, parseCurl } from '@/lib/curl-parser'
import { useToolDraft } from '@/hooks/useToolDraft'

const EXAMPLE_CURL = `curl -X POST 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"name":"张三","email":"zhang@example.com"}'`

export default function CurlConverter() {
  const [input, setInput] = useToolDraft('curl-converter', 'input', EXAMPLE_CURL, { queryParam: 'curl' })
  const [lang, setLang] = useState('fetch')

  const result = useMemo(() => {
    const parsed = parseCurl(input)
    if (typeof parsed === 'string') return { code: '', error: parsed }
    switch (lang) {
      case 'fetch':
        return { code: curlToFetch(parsed), error: '' }
      case 'python':
        return { code: curlToPython(parsed), error: '' }
      case 'go':
        return { code: curlToGo(parsed), error: '' }
      default:
        return { code: '', error: '' }
    }
  }, [input, lang])

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setInput(EXAMPLE_CURL)} />
        <Select
          value={lang}
          onChange={setLang}
          options={[
            { value: 'fetch', label: 'JavaScript (fetch)' },
            { value: 'python', label: 'Python (requests)' },
            { value: 'go', label: 'Go (net/http)' },
          ]}
        />
      </div>

      <ToolSection label="cURL 命令">
        <TextArea value={input} onChange={setInput} rows={8} />
      </ToolSection>

      {result.error ? (
        <div className="text-sm text-[var(--error)]">{result.error}</div>
      ) : (
        <ToolSection label="转换结果" action={result.code ? <CopyButton text={result.code} /> : undefined}>
          <TextArea value={result.code} readOnly rows={14} />
        </ToolSection>
      )}
    </ToolPanel>
  )
}
