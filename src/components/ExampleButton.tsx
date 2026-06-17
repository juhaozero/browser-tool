import { Button } from './ui'

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
