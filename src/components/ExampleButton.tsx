import { Button } from './ui'

/** 各工具页「加载示例」按钮，统一交互样式 */
interface ExampleButtonProps {
  onClick: () => void
  label?: string
}

export function ExampleButton({ onClick, label = '加载示例' }: ExampleButtonProps) {
  return (
    <Button variant="ghost" onClick={onClick}>
      {label}
    </Button>
  )
}
