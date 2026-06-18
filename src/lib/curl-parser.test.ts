import { describe, expect, it } from 'vitest'
import { curlToGo, curlToPython, parseCurl } from './curl-parser'

describe('parseCurl', () => {
  it('parses JSON POST with headers', () => {
    const result = parseCurl(
      `curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -d '{"name":"test"}'`,
    )
    expect(typeof result).not.toBe('string')
    if (typeof result === 'string') return
    expect(result.method).toBe('POST')
    expect(result.url).toBe('https://api.example.com/users')
    expect(result.body).toBe('{"name":"test"}')
    expect(result.headers['Content-Type']).toBe('application/json')
  })

  it('normalizes bare hostname to https', () => {
    const result = parseCurl('curl example.com/api')
    expect(typeof result).not.toBe('string')
    if (typeof result === 'string') return
    expect(result.url).toBe('https://example.com/api')
  })

  it('parses combined -XPOST flag', () => {
    const result = parseCurl("curl -XPOST https://api.example.com -d 'a=1'")
    expect(typeof result).not.toBe('string')
    if (typeof result === 'string') return
    expect(result.method).toBe('POST')
  })

  it('parses -F multipart form', () => {
    const result = parseCurl("curl -F 'name=alice' https://api.example.com/upload")
    expect(typeof result).not.toBe('string')
    if (typeof result === 'string') return
    expect(result.formData.name).toBe('alice')
    expect(result.method).toBe('POST')
  })
})

describe('curlToPython', () => {
  it('emits multipart files dict for -F', () => {
    const parsed = {
      method: 'POST',
      url: 'https://api.example.com',
      headers: {},
      body: '',
      formData: { name: 'alice' },
    }
    const code = curlToPython(parsed)
    expect(code).toContain('(None, "alice")')
    expect(code).toContain('files=files')
    expect(code).not.toContain('data=files')
  })
})

describe('curlToGo', () => {
  it('includes multipart writer for -F', () => {
    const parsed = {
      method: 'POST',
      url: 'https://api.example.com',
      headers: {},
      body: '',
      formData: { field: 'value' },
    }
    const code = curlToGo(parsed)
    expect(code).toContain('multipart.NewWriter')
    expect(code).toContain('WriteField')
  })
})
