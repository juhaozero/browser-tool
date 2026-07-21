import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { clearToolDraft, loadToolDraft, saveToolDraft } from '@/lib/tool-draft'

/**
 * 工具文本草稿：优先 URL 预填 → 本地草稿 → initial
 * URL 参数只消费一次（replace 清掉，避免刷新反复覆盖）
 */
export function useToolDraft(
  toolId: string,
  field: string,
  initial = '',
  options?: {
    /** 对应的 query 参数名，例如 input / hex / expr */
    queryParam?: string
    debounceMs?: number
  },
): [string, (value: string) => void, { clearDraft: () => void }] {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParam = options?.queryParam
  const debounceMs = options?.debounceMs ?? 400
  const clearedQuery = useRef(false)

  const [value, setValue] = useState(() => {
    if (queryParam) {
      const fromUrl = searchParams.get(queryParam)
      if (fromUrl !== null) return fromUrl
    }
    return loadToolDraft(toolId, field) ?? initial
  })

  // 清掉已消费的预填参数，不在 effect 里 setValue
  useEffect(() => {
    if (!queryParam || clearedQuery.current) return
    if (!searchParams.has(queryParam)) return
    clearedQuery.current = true
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(queryParam)
        return next
      },
      { replace: true },
    )
  }, [queryParam, searchParams, setSearchParams])

  useEffect(() => {
    const timer = window.setTimeout(() => saveToolDraft(toolId, field, value), debounceMs)
    return () => clearTimeout(timer)
  }, [toolId, field, value, debounceMs])

  const clearDraft = () => {
    clearToolDraft(toolId, field)
    setValue(initial)
  }

  return [value, setValue, { clearDraft }]
}
