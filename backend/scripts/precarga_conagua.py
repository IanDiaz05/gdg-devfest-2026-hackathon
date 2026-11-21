"""Llena con datos del SMN-CONAGUA las zonas que todavía no tienen clima en quesiembro.db.

Usa la estación del SMN más cercana (data/smn_estaciones.json, sin red) y guarda el clima con
origen "conagua". No consulta Open-Meteo, así que no tiene límite de peticiones.

- Solo llena zonas vacías: nunca reemplaza un clima de Open-Meteo.
- Cuando después se corre scripts/precarga_cache.py, esas zonas se vuelven a pedir a Open-Meteo y
  el dato de CONAGUA se reemplaza por el completo.
- Diferencias con Open-Meteo: la estación puede estar hasta a --radio km y el % de heladas es
  estimado (el SMN solo publica promedios mensuales).

Uso:
  backend\\.venv\\Scripts\\python backend\\scripts\\precarga_conagua.py              (todas las zonas)
  backend\\.venv\\Scripts\\python backend\\scripts\\precarga_conagua.py --limit 100
  backend\\.venv\\Scripts\\python backend\\scripts\\precarga_conagua.py --estado Yucatán --estado Campeche
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from app.core import database  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.engine import clima_processor  # noqa: E402
from app.services.datos_locales import normalizar  # noqa: E402
from scripts.precarga_cache import _celdas_por_poblacion  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("precarga_conagua")


async def main_async(limit: int | None, radio_km: float, estados: list[str]) -> int:
    await database.init_db()
    filtro = {normalizar(e) for e in estados}
    celdas = [c for c in _celdas_por_poblacion() if not filtro or normalizar(c["estado"]) in filtro]
    logger.info("Zonas candidatas: %s (estación del SMN a %s km o menos)", len(celdas), radio_km)

    guardadas = ya_tenian = sin_estacion = 0
    for celda in celdas:
        if limit is not None and guardadas >= limit:
            break
        if await database.get_clima_cache(celda["lat_grid"], celda["lon_grid"]) is not None:
            ya_tenian += 1
            continue
        respaldo = clima_processor.resumen_smn_fallback(celda["lat"], celda["lon"], radio_km)
        if respaldo is None:
            sin_estacion += 1
            continue
        resumen, periodo, fuente = respaldo
        await database.save_clima_cache(
            celda["lat_grid"],
            celda["lon_grid"],
            celda["altitud_m"],
            periodo,
            resumen,
            origen=database.ORIGEN_CONAGUA,
            fuente=fuente,
        )
        guardadas += 1
        logger.info(
            "Guardada %s: %s, %s ← estación %s (%.1f km)",
            guardadas, celda["nombre"], celda["estado"], fuente["estacion"], fuente["distancia_km"],
        )

    logger.info(
        "Listo. Guardadas con CONAGUA: %s | Ya tenían clima: %s | Sin estación cercana: %s | DB: %s",
        guardadas, ya_tenian, sin_estacion, settings.DB_PATH,
    )
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Llena con el SMN-CONAGUA las zonas sin clima.")
    parser.add_argument("--limit", type=int, default=None, help="Máximo de zonas nuevas (default: todas).")
    parser.add_argument("--radio", type=float, default=clima_processor.RADIO_SMN_FALLBACK_KM,
                        help="Distancia máxima a la estación, en km (default: %(default)s).")
    parser.add_argument("--estado", action="append", default=[], help="Solo este estado (se puede repetir).")
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error("--limit debe ser al menos 1")
    sys.exit(asyncio.run(main_async(args.limit, args.radio, args.estado)))


if __name__ == "__main__":
    main()
