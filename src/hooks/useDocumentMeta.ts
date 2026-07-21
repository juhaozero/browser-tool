import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getToolById } from '@/data/tools'
import { setHomeDocumentMeta, setToolDocumentMeta } from '@/lib/document-meta'

/** 随路由同步 SEO title / description（与构建预渲染对齐） */
export function useDocumentMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const match = pathname.match(/^\/tool\/([^/]+)/)
    if (match?.[1]) {
      const tool = getToolById(match[1])
      if (tool) {
        setToolDocumentMeta(tool)
        return
      }
    }
    setHomeDocumentMeta()
  }, [pathname])
}
