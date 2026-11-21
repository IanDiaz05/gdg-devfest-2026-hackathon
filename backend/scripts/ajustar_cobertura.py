"""Deja en la app solo los lugares con clima confiable y agrega los municipios que faltaban.

Criterio (app/engine/clima_processor.py → estacion_adecuada): una zona con clima de CONAGUA es
confiable si su estación del SMN está a 30 km o menos y a no más de 150 m de diferencia de altura
(15 km si no se conoce la altura). Las zonas con clima de Open-Meteo siempre se quedan.

Pasos:
1. Zonas con clima de CONAGUA en quesiembro.db:
   - si su estación cumple, se quedan;
   - si no, se busca otra estación cercana que sí cumpla y se recalcula;
   - si no hay ninguna, se borran y sus localidades salen de data/ciudades.json.
2. Municipios del INEGI que no tenían ninguna localidad en el buscador: se agrega su localidad más
   poblada de GeoNames (con su altura) si tiene una estación que cumpla, y se guarda su clima.

Necesita (descargados por descargar_ciudades.py, en data/raw/):
  data/raw/geonames/MX.zip, data/raw/geonames/admin1CodesASCII.txt, data/raw/inegi/municipios.json
y data/smn_estaciones.json con altitudes (descargar_smn.py --solo-altitudes).

Uso:
  backend\\.venv\\Scripts\\python backend\\scripts\\ajustar_cobertura.py --simular   (solo cuenta)
  backend\\.venv\\Scripts\\python backend\\scripts\\ajustar_cobertura.py              (aplica)
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import sqlite3
import sys
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND))
sys.path.insert(0, str(_BACKEND / "scripts" / "descargas"))

from app.core.config import settings  # noqa: E402
from app.engine import clima_processor as cp  # noqa: E402
from app.services.datos_locales import normalizar  # noqa: E402
from comun import DATA, RAW, guardar_json, hoy  # noqa: E402
from descargar_ciudades import ESTADOS_INEGI, mapa_estados  # noqa: E402


def celda(lat: float, lon: float) -> tuple[float, float]:
    return round(lat, 1), round(lon, 1)


def localidad_por_municipio(faltantes: set[str]) -> dict[str, dict]:
    """La localidad más poblada de GeoNames de cada municipio (clave INEGI estado+municipio)."""
    estados = mapa_estados(RAW / "geonames" / "admin1CodesASCII.txt")
    mejor: dict[str, dict] = {}
    with zipfile.ZipFile(RAW / "geonames" / "MX.zip") as z:
        lector = csv.reader(io.TextIOWrapper(z.open("MX.txt"), encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE)
        for r in lector:
            if r[6] != "P" or not r[11].isdigit() or not estados.get(r[10]):
                continue
            cve = f"{estados[r[10]]}{r[11].zfill(3)}"
            poblacion = int(r[14] or 0)
            if cve in faltantes and (cve not in mejor or poblacion > mejor[cve]["poblacion"]):
                altitud = int(r[16]) if r[16] not in ("", "-9999") else (int(r[15]) if r[15] else None)
                mejor[cve] = {"id": int(r[0]), "nombre": r[1], "lat": round(float(r[4]), 4),
                              "lon": round(float(r[5]), 4), "altitud_m": altitud, "poblacion": poblacion}
    return mejor


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--simular", action="store_true", help="solo contar, sin escribir nada")
    args = ap.parse_args()

    ruta_ciudades = DATA / "ciudades.json"
    datos_ciudades = json.loads(ruta_ciudades.read_text(encoding="utf-8"))
    ciudades = datos_ciudades["ciudades"]
    municipios = json.loads((RAW / "inegi" / "municipios.json").read_text(encoding="utf-8"))
    db = sqlite3.connect(settings.DB_PATH)
    filas = {celda(a, b): {"origen": o, "altitud_m": al, "fuente": json.loads(f) if f else None}
             for a, b, o, al, f in db.execute(
                 "SELECT lat_grid, lon_grid, origen, altitud_m, fuente_json FROM clima_historico_cache")}

    # 1. Zonas de CONAGUA: se quedan, cambian de estación o se borran
    actualizar, borrar = {}, set()
    for zona, fila in filas.items():
        if fila["origen"] != "conagua":
            continue
        fuente = fila["fuente"] or {}
        estacion = next((e for e in cp.smn()["estaciones"] if e["clave"] == fuente.get("clave")), None)
        if estacion and cp.estacion_adecuada(float(fuente.get("distancia_km", 999)), fila["altitud_m"], estacion.get("altitud_m")):
            continue
        respaldo = cp.resumen_smn_fallback(zona[0], zona[1], altitud_m=fila["altitud_m"])
        if respaldo:
            actualizar[zona] = respaldo
        else:
            borrar.add(zona)

    # Localidades que se quedan sin clima confiable salen del buscador
    municipios_antes = {c["cvegeo"] for c in ciudades if c.get("cvegeo")}
    quedan = [c for c in ciudades if celda(c["lat"], c["lon"]) not in borrar]
    municipios_despues = {c["cvegeo"] for c in quedan if c.get("cvegeo")}
    eliminados = municipios_antes - municipios_despues

    # 2. Municipios que no estaban en el buscador
    faltantes = set(municipios) - municipios_antes
    nuevos, nuevas_zonas = [], {}
    for cve, lugar in sorted(localidad_por_municipio(faltantes).items()):
        zona = celda(lugar["lat"], lugar["lon"])
        # Con Open-Meteo la zona ya es confiable; con CONAGUA, la estación debe cumplir el criterio
        # con la altura de esta localidad (no la de la ciudad que ya estaba en la zona)
        tiene_clima = zona in filas and filas[zona]["origen"] == "open-meteo"
        # Cada localidad nueva se valida con su propia estación y altura
        respaldo = None if tiene_clima else cp.resumen_smn_fallback(lugar["lat"], lugar["lon"], altitud_m=lugar["altitud_m"])
        if not tiene_clima and not respaldo:
            continue
        ent, mun = cve[:2], cve[2:]
        nuevos.append({"id": lugar["id"], "nombre": lugar["nombre"], "busqueda": normalizar(lugar["nombre"]),
                       "estado": ESTADOS_INEGI[ent][0], "cve_ent": ent, "cve_mun": mun, "cvegeo": cve,
                       "municipio": municipios[cve], "lat": lugar["lat"], "lon": lugar["lon"],
                       "altitud_m": lugar["altitud_m"], "poblacion": lugar["poblacion"], "tipo": "localidad"})
        # Zona sin clima: se guarda el de la primera localidad nueva que cae en ella
        if respaldo and (zona not in filas or zona in borrar) and zona not in nuevas_zonas:
            nuevas_zonas[zona] = (respaldo, lugar["altitud_m"])

    total_mun = len(municipios)
    print(f"Zonas de CONAGUA: {len(actualizar)} cambian de estación, {len(borrar)} se borran")
    print(f"Localidades del buscador: {len(ciudades):,} → {len(quedan) + len(nuevos):,} "
          f"(salen {len(ciudades) - len(quedan):,}, entran {len(nuevos):,})")
    print(f"Municipios: se eliminan {len(eliminados):,} | se quedan {len(municipios_despues):,} | "
          f"se añaden {len(nuevos):,} | total en el buscador {len(municipios_despues) + len(nuevos):,} de {total_mun:,}")
    if args.simular:
        return

    ahora = datetime.now(timezone.utc).isoformat()
    sql = ("INSERT OR REPLACE INTO clima_historico_cache (lat_grid, lon_grid, altitud_m, periodo_referencia, "
           "resumen_mensual_json, created_at, origen, fuente_json) VALUES (?, ?, ?, ?, ?, ?, 'conagua', ?)")
    for zona, (resumen, periodo, fuente) in actualizar.items():
        db.execute(sql, (*zona, filas[zona]["altitud_m"], periodo, json.dumps(resumen, ensure_ascii=False), ahora, json.dumps(fuente, ensure_ascii=False)))
    for zona in borrar:
        if zona not in nuevas_zonas:
            db.execute("DELETE FROM clima_historico_cache WHERE lat_grid = ? AND lon_grid = ?", zona)
    for zona, ((resumen, periodo, fuente), altitud) in nuevas_zonas.items():
        db.execute(sql, (*zona, altitud or 0, periodo, json.dumps(resumen, ensure_ascii=False), ahora, json.dumps(fuente, ensure_ascii=False)))
    db.commit()

    datos_ciudades["ciudades"] = quedan + nuevos
    datos_ciudades["total"] = len(datos_ciudades["ciudades"])
    datos_ciudades["generado"] = hoy()
    datos_ciudades["criterio"] = (f"{datos_ciudades.get('criterio', '')}; solo lugares con clima confiable "
                                  "(Open-Meteo o estación del SMN a 30 km o menos y a no más de 150 m de altura de diferencia), "
                                  "más la localidad principal de los municipios que faltaban").lstrip("; ")
    guardar_json(datos_ciudades, ruta_ciudades, compacto=True)
    print("Aplicado: data/ciudades.json y quesiembro.db actualizados")


if __name__ == "__main__":
    main()
