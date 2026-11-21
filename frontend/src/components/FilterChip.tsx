import type { LucideIcon } from 'lucide-react'

export function FilterChip({ label, icon: Icon, selected, onClick, count, name }: {
  label: string
  icon: LucideIcon
  selected: boolean
  onClick: () => void
  count?: number
  name: string
}) {
  return <label className="relative shrink-0 snap-start cursor-pointer">
    <input type="radio" name={name} checked={selected} onChange={onClick}
      className="peer sr-only top-1/2 left-1/2" />
    <span className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 motion-safe:transition motion-safe:duration-200 motion-safe:active:scale-95 motion-reduce:transition-none ${selected
      ? 'border-primary bg-primary text-primary-foreground shadow-md'
      : 'border-primary/15 bg-card text-primary hover:border-primary/40 hover:bg-primary/5 motion-safe:hover:-translate-y-0.5'}`}>
      <Icon size={17} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
      {label}
      {count !== undefined && <span className={`min-w-5 rounded-full px-1.5 text-center text-xs leading-5 tabular-nums ${selected ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-secondary text-primary'}`}>{count}</span>}
    </span>
  </label>
}
