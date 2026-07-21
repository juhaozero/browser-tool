import { Star } from 'lucide-react'
import { toggleFavoriteTool } from '@/lib/favorites'

interface FavoriteButtonProps {
  toolId: string
  favorite: boolean
  onChange: (favorite: boolean) => void
  className?: string
}

export function FavoriteButton({ toolId, favorite, onChange, className = '' }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      aria-label={favorite ? '取消收藏' : '收藏'}
      title={favorite ? '取消收藏' : '收藏'}
      className={`rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-amber-500 ${
        favorite ? 'text-amber-500' : ''
      } ${className}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const next = toggleFavoriteTool(toolId)
        onChange(next)
      }}
    >
      <Star size={16} className={favorite ? 'fill-current' : ''} />
    </button>
  )
}
