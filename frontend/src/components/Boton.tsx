import type { ButtonHTMLAttributes } from 'react'

const estilos = {
  primario: 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover',
  secundario: 'border-border bg-card text-primary hover:border-sage hover:bg-secondary',
}

export function Boton({ variante = 'primario', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof estilos
}) {
  return <button
    type="button"
    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 motion-safe:transition motion-safe:duration-200 motion-safe:enabled:active:scale-[0.98] ${estilos[variante]} ${className}`}
    {...props}
  />
}
