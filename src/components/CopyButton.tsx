import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyText } from '@/lib/utils'
import { Button } from './ui'

/** 一键复制到剪贴板，成功后短暂切换为「已复制」 */
interface CopyButtonProps {
  text: string
  label?: string
}

export function CopyButton({ text, label = '复制' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyText(text)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <Button variant="ghost" onClick={handleCopy} disabled={!text}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? '已复制' : label}
    </Button>
  )
}
