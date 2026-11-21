import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

import type { Diagnostico } from "../types/api";
import { MesSelect } from "./MesSelect";

export function BarraUbicacion({
  ubicacion,
  mes,
  onMes,
  busqueda,
}: {
  ubicacion: Diagnostico["ubicacion"];
  mes: number;
  busqueda: string;
  onMes: (mes: number) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
      <div className="surface flex min-h-14 min-w-0 items-center gap-3 px-4 py-2">
        <MapPin className="size-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">
            {ubicacion.nombre}, {ubicacion.estado}
          </p>
          <Link to={{ pathname: "/", search: busqueda }} className="inline-flex min-h-8 items-center text-sm font-medium text-primary underline underline-offset-2">
            Cambiar ubicación
          </Link>
        </div>
      </div>
      <MesSelect mes={mes} onChange={onMes} />
    </div>
  );
}
