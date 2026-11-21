import { CloudSun, Droplets, Mountain, RadioTower, Satellite, Snowflake, Sun, ThermometerSnowflake, ThermometerSun } from "lucide-react";

import type { ReactNode } from "react";

import type { Diagnostico } from "../types/api";
import { formatoNumero } from "../utils/consulta";

type ClimaZona = Diagnostico["clima_zona"];
const formatearTemp = (valor: number) => `${formatoNumero.format(valor)} °C`;

function IconoClima({ clima }: { clima: ClimaZona }) {
  const { temp_media_c: t, anios_con_helada_pct: h } = clima;
  const frio = h >= 30 || t < 12;
  const Icono = frio ? Snowflake : t >= 22 ? Sun : CloudSun;
  return (
    <div
      className={`grid size-13 shrink-0 place-items-center rounded-full ${frio ? "bg-frost-soft text-frost" : "bg-sun-soft text-warning"}`}
      aria-hidden
    >
      <Icono className="size-7" strokeWidth={1.75} />
    </div>
  );
}

function Metrica({ icono, etiqueta, valor }: { icono: ReactNode; etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icono}
        <span className="min-w-0">{etiqueta}</span>
      </div>
      <p className="mt-1 text-sm font-semibold">{valor}</p>
    </div>
  );
}

/** De dónde sale el clima típico de la zona, para que se pueda verificar */
function FuenteClima({ clima }: { clima: ClimaZona }) {
  const estacion = clima.origen === "conagua" ? clima.estacion_smn : null;
  if (!estacion) {
    return (
      <p className="mt-4 flex gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">
        <Satellite className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
        <span>
          <strong className="text-foreground">Fuente del clima: Open-Meteo.</strong> Datos diarios {clima.periodo_referencia} calculados
          para el punto exacto de tu ciudad.
        </span>
      </p>
    );
  }
  const dif = estacion.diferencia_altitud_m;
  const altura = dif == null ? "" : dif === 0 ? ", a la misma altura que tu zona"
    : `, ${formatoNumero.format(Math.abs(dif))} m más ${dif > 0 ? "abajo" : "arriba"} que tu zona`;
  return (
    <p className="mt-4 flex gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">
      <RadioTower className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
      <span>
        <strong className="text-foreground">Fuente del clima: estación {estacion.estacion} del SMN-CONAGUA</strong>, a{" "}
        {formatoNumero.format(estacion.distancia_km)} km{altura}. Promedios mensuales {clima.periodo_referencia.replace("SMN-CONAGUA ", "")}
        {estacion.heladas_estimadas && "; los años con helada son una estimación a partir de la mínima promedio"}.
      </span>
    </p>
  );
}

export function ClimaCard({ clima, altitud }: { clima: ClimaZona; altitud: number }) {
  const ic = "size-3.5 shrink-0";
  return (
    <section aria-labelledby="clima-titulo">
      <h2 id="clima-titulo" className="text-2xl font-bold tracking-tight">
        Clima histórico · {clima.periodo_referencia}
      </h2>
      <div className="surface mt-4 p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Temperatura media de {clima.mes_nombre.toLocaleLowerCase("es-MX")}</p>
            <p className="mt-1 text-4xl font-bold sm:text-5xl tracking-tight text-primary">{formatearTemp(clima.temp_media_c)}</p>
          </div>
          <IconoClima clima={clima} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 border-t border-border pt-4">
          <Metrica
            icono={<ThermometerSnowflake className={ic} strokeWidth={1.75} aria-hidden />}
            etiqueta="Mín. prom."
            valor={formatearTemp(clima.temp_min_promedio_c)}
          />
          <Metrica
            icono={<ThermometerSun className={ic} strokeWidth={1.75} aria-hidden />}
            etiqueta="Máx. prom."
            valor={formatearTemp(clima.temp_max_promedio_c)}
          />
          <Metrica
            icono={<Snowflake className={ic} strokeWidth={1.75} aria-hidden />}
            etiqueta="Años con helada"
            valor={`${formatoNumero.format(clima.anios_con_helada_pct)} %`}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-frost-soft px-3 py-2">
            <p className="text-muted-foreground">Mes más frío</p>
            <p className="mt-0.5 font-semibold text-foreground">
              {clima.mes_mas_frio.nombre} · {formatearTemp(clima.mes_mas_frio.temp_media_c)}
            </p>
          </div>
          <div className="rounded-xl bg-sun-soft px-3 py-2">
            <p className="text-muted-foreground">Mes más caluroso</p>
            <p className="mt-0.5 font-semibold text-foreground">
              {clima.mes_mas_caluroso.nombre} · {formatearTemp(clima.mes_mas_caluroso.temp_media_c)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-sm text-muted-foreground">
            <Mountain className="size-3.5" strokeWidth={1.75} aria-hidden />
            Altitud: {formatoNumero.format(altitud)} m
          </span>
          {clima.lluvia_mes_mm != null && <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-sm text-muted-foreground">
            <Droplets className="size-3.5" aria-hidden /> Lluvia histórica: {formatoNumero.format(clima.lluvia_mes_mm)} mm
          </span>}
          {clima.sequia && (
            <span className="rounded-lg bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">
              {clima.sequia.nivel_nombre} · {clima.sequia.nivel}
            </span>
          )}
        </div>
        <FuenteClima clima={clima} />
        {clima.sequia && (
          <p className="mt-3 rounded-xl border border-warning-border bg-warning-soft px-3 py-2 text-xs text-warning">
            {clima.sequia.consejo}
            <span className="mt-1 block opacity-80">Reporte CONAGUA · <time dateTime={clima.sequia.fecha_dato}>{clima.sequia.fecha_dato}</time></span>
          </p>
        )}
        {clima.lluvia_reciente && (
          <div className="mt-4 rounded-xl bg-secondary p-3 text-sm">
            <h3 className="font-semibold">Lluvia reciente</h3>
            <p className="mt-1">{clima.lluvia_reciente.mensaje}</p>
            <p className="mt-1">{clima.lluvia_reciente.consejo}</p>
            <p className="mt-1 text-sm text-muted-foreground">Fuente: {clima.lluvia_reciente.fuente}</p>
          </div>
        )}
      </div>
    </section>
  );
}
