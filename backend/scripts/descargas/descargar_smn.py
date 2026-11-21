"""Descarga los resúmenes mensuales por estación del SMN (CONAGUA) y genera data/smn_estaciones.json.

Cada mes el SMN publica 4 archivos CSV con el dato de ~1,400 estaciones meteorológicas:
lluvia acumulada (Lluv), temperatura media (TMed), máxima (TMax) y mínima (TMin).
No hay API oficial, pero cada archivo tiene una dirección fija:
    https://smn.conagua.gob.mx/tools/RESOURCES/com_archivo_datos_resumenes/{AAAA}{MM}010000{Tipo}.csv
Hay archivos desde enero de 2013 hasta el mes pasado.

Este script es INCREMENTAL: guarda cada archivo en data/raw/smn/ y en la siguiente corrida solo
baja los meses nuevos. Para tenerlo al día basta con correrlo una vez al mes (ver backend/README.md).

Genera, por estación:
- `normal`: promedio de cada mes del año (lluvia, mínima, máxima y media) con los años completos
  disponibles (2013 al año pasado), solo si hay al menos 5 años de dato.
- `ultimo`: el dato del último mes publicado.

Fuente: Servicio Meteorológico Nacional (SMN), CONAGUA.
Uso:    backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\descargar_smn.py [--desde 2013-01] [--forzar]
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from statistics import mean

from comun import BACKEND, DATA, RAW, guardar_json, hoy, preparar, sesion

URL = "https://smn.conagua.gob.mx/tools/RESOURCES/com_archivo_datos_resumenes/{ym}010000{tipo}.csv"
TIPOS = {"Lluv": "lluvia_mm", "TMin": "tmin_c", "TMax": "tmax_c", "TMed": "tmed_c"}
CARPETA = RAW / "smn"
FALTANTES = CARPETA / "_faltantes.json"  # meses que el SMN todavía no publica (se reintentan)
MIN_ANIOS_NORMAL = 5


def meses(desde: str, hasta: date) -> list[str]:
    a, m = map(int, desde.split("-"))
    salida = []
    while (a, m) <= (hasta.year, hasta.month):
        salida.append(f"{a}{m:02d}")
        a, m = (a + 1, 1) if m == 12 else (a, m + 1)
    return salida


def descargar_archivo(ym: str, tipo: str, forzar: bool) -> str:
    """Devuelve 'ok', 'cache' o 'no_publicado'."""
    ruta = CARPETA / f"{ym}{tipo}.csv"
    if ruta.exists() and ruta.stat().st_size > 500 and not forzar:
        return "cache"
    http = sesion()
    for intento in range(1, 4):
        try:
            # Si el archivo no existe, el SMN responde 301 hacia otra página: se trata como "no publicado"
            r = http.get(URL.format(ym=ym, tipo=tipo), timeout=60, allow_redirects=False)
            if r.status_code in (301, 302, 404):
                return "no_publicado"
            r.raise_for_status()
            if len(r.content) < 500:
                return "no_publicado"
            CARPETA.mkdir(parents=True, exist_ok=True)
            ruta.write_bytes(r.content)
            return "ok"
        except Exception as e:  # noqa: BLE001 - se reintenta cualquier fallo de red
            print(f"  {ym} {tipo}: error {e}, reintento {intento}")
            time.sleep(3 * intento)
    return "no_publicado"


def leer(ruta) -> list[dict]:
    """Lee un CSV del SMN (Latin-1; los encabezados cambian entre lluvia y temperatura)."""
    texto = ruta.read_bytes().decode("latin-1")
    filas = list(csv.reader(io.StringIO(texto)))
    if not filas:
        return []
    cab = [c.strip().lower() for c in filas[0]]

    def col(*nombres):
        return next((cab.index(n) for n in nombres if n in cab), None)

    i_lon, i_lat, i_edo, i_clave = col("lon"), col("lat"), col("edo"), col("clave")
    i_nom = col("estacion", "est", "estación")
    salida = []
    for f in filas[1:]:
        if len(f) < len(cab) or None in (i_lon, i_lat, i_clave):
            continue
        try:
            valor = float(f[-1])
            lat, lon = float(f[i_lat]), float(f[i_lon])
        except ValueError:
            continue
        salida.append({
            "clave": f[i_clave].strip(),
            # "SMN*" marca las estaciones del propio SMN; se quita para mostrar el nombre limpio
            "nombre": (f[i_nom] if i_nom is not None else f[i_clave]).replace("SMN*", "").strip().rstrip("*").strip(),
            "edo": f[i_edo].strip() if i_edo is not None else "",
            "lat": round(lat, 4), "lon": round(lon, 4), "valor": valor,
        })
    return salida


def main() -> None:
    preparar()
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--desde", default="2013-01", help="AAAA-MM (el SMN tiene archivos desde 2013-01)")
    ap.add_argument("--forzar", action="store_true", help="volver a descargar los meses que ya existen")
    ap.add_argument("--hilos", type=int, default=4)
    args = ap.parse_args()

    lista = meses(args.desde, date.today())
    tareas = [(ym, t) for ym in lista for t in TIPOS]
    print(f"SMN (CONAGUA): {len(lista)} meses x {len(TIPOS)} tipos = {len(tareas)} archivos")
    with ThreadPoolExecutor(max_workers=args.hilos) as ex:
        resultados = list(ex.map(lambda yt: (yt, descargar_archivo(*yt, args.forzar)), tareas))
    conteo = {k: sum(1 for _, r in resultados if r == k) for k in ("ok", "cache", "no_publicado")}
    print(f"  nuevos: {conteo['ok']} | ya estaban: {conteo['cache']} | no publicados: {conteo['no_publicado']}")
    faltantes = sorted(f"{ym}{t}" for (ym, t), r in resultados if r == "no_publicado")
    FALTANTES.parent.mkdir(parents=True, exist_ok=True)
    FALTANTES.write_text(json.dumps(faltantes, indent=1), encoding="utf-8")

    # --- Procesar ---
    disponibles = sorted({p.stem[:6] for p in CARPETA.glob("*.csv")})
    if not disponibles:
        raise SystemExit("ERROR: no hay archivos del SMN descargados")
    ultimo_mes = max(ym for ym in disponibles if (CARPETA / f"{ym}Lluv.csv").exists())
    anio_actual = date.today().year
    estaciones: dict[str, dict] = {}
    valores: dict[tuple[str, str, int], list[float]] = {}  # (clave, campo, mes) -> valores por año
    for ym in disponibles:
        anio, mes = int(ym[:4]), int(ym[4:])
        for tipo, campo in TIPOS.items():
            ruta = CARPETA / f"{ym}{tipo}.csv"
            if not ruta.exists():
                continue
            for f in leer(ruta):
                e = estaciones.setdefault(f["clave"], {"clave": f["clave"], "nombre": f["nombre"], "edo": f["edo"],
                                                       "lat": f["lat"], "lon": f["lon"], "ultimo": {}})
                if tipo == "Lluv":  # los archivos de lluvia traen nombres y coordenadas más completos
                    e.update(nombre=f["nombre"], edo=f["edo"] or e["edo"], lat=f["lat"], lon=f["lon"])
                if anio < anio_actual:
                    valores.setdefault((f["clave"], campo, mes), []).append(f["valor"])
                if ym == ultimo_mes:
                    e["ultimo"][campo] = round(f["valor"], 1)

    salida = []
    for clave, e in estaciones.items():
        normal = {}
        for campo in TIPOS.values():
            serie = []
            for mes in range(1, 13):
                v = valores.get((clave, campo, mes), [])
                serie.append(round(mean(v), 1) if len(v) >= MIN_ANIOS_NORMAL else None)
            if any(x is not None for x in serie):
                normal[campo] = serie
        if not normal and not e["ultimo"]:
            continue
        salida.append({**{k: e[k] for k in ("clave", "nombre", "edo", "lat", "lon")},
                       "normal": normal,
                       "ultimo": e["ultimo"] or None})

    guardar_json({
        "fuente": "Servicio Meteorológico Nacional (SMN), CONAGUA: resúmenes mensuales por estación",
        "generado": hoy(),
        "ultimo_mes": f"{ultimo_mes[:4]}-{ultimo_mes[4:]}",
        "periodo_normal": f"{disponibles[0][:4]}-{anio_actual - 1}",
        "min_anios_normal": MIN_ANIOS_NORMAL,
        "unidades": {"lluvia_mm": "mm acumulados en el mes", "tmin_c": "°C", "tmax_c": "°C", "tmed_c": "°C"},
        "total": len(salida),
        "estaciones": salida,
    }, DATA / "smn_estaciones.json", compacto=True)
    con_ultimo = sum(1 for s in salida if s["ultimo"])
    print(f"  {len(salida):,} estaciones | {con_ultimo:,} con dato de {ultimo_mes[:4]}-{ultimo_mes[4:]} | "
          f"archivos en {CARPETA.relative_to(BACKEND)}")


if __name__ == "__main__":
    main()
