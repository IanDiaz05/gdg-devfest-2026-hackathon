import { ChevronDown } from "lucide-react";

import { meses } from '../utils/consulta'

export function MesSelect({ mes, onChange }: { mes: number; onChange: (mes: number) => void }) {
  return (
    <label className="relative flex h-full items-center">
      <span className="sr-only">Mes de consulta</span>
      <select
        id="selector-mes"
        value={mes}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-full min-h-14 w-full cursor-pointer appearance-none rounded-2xl border border-border bg-card py-2 pr-7 pl-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {meses.map((nombre, i) => (
          <option key={nombre} value={i + 1}>
            {nombre}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 size-4 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
    </label>
  );
}
