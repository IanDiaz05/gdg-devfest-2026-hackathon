import type { ButtonHTMLAttributes } from 'react'

export function Chip({ selected, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return <button
    type="button"
    aria-pressed={selected}
    className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-secondary'} ${className}`}
    {...props}
  />
}
