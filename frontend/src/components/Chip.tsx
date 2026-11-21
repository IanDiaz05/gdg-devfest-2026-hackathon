import type { ButtonHTMLAttributes } from 'react'

export function Chip({ selected, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return <button
    type="button"
    aria-pressed={selected}
    className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-secondary'} ${className}`}
    {...props}
  />
}
