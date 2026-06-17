/**
 * 工具页通用 UI 组件
 * ToolPanel / ToolSection 为各工具提供一致的布局结构
 */
import type { ReactNode } from 'react'

interface ToolPanelProps {
  children: ReactNode
  className?: string
}

export function ToolPanel({ children, className = '' }: ToolPanelProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-6 ${className}`}
    >
      {children}
    </div>
  )
}

interface ToolSectionProps {
  label: string
  children: ReactNode
  action?: ReactNode
}

export function ToolSection({ label, children, action }: ToolSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-[var(--text-muted)]">{label}</label>
        {action}
      </div>
      {children}
    </div>
  )
}

interface TextAreaProps {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  rows?: number
  readOnly?: boolean
  mono?: boolean
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 8,
  readOnly = false,
  mono = true,
}: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
      className={`w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)] ${mono ? 'font-mono' : ''}`}
    />
  )
}

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  type?: 'button' | 'submit'
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  disabled,
  type = 'button',
}: ButtonProps) {
  const styles = {
    primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
    secondary:
      'border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text)] hover:border-[var(--accent)]',
    ghost: 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  )
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export function Select({ value, onChange, options }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}

export function Input({ value, onChange, placeholder, type = 'text' }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
    />
  )
}

interface AlertProps {
  type: 'error' | 'success' | 'info'
  children: ReactNode
}

export function Alert({ type, children }: AlertProps) {
  const styles = {
    error: 'border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] text-[var(--error)]',
    success:
      'border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]',
    info: 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]',
  }
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles[type]}`}>{children}</div>
  )
}
