"""Precarga clima historico de Open-Meteo en quesiembro.db para las ciudades mas pobladas.

Uso:
  backend/.venv/bin/python backend/scripts/precarga_cache.py
  backend/.venv/bin/python backend/scripts/precarga_cache.py --limit 5 --delay 2.0
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import random
import sys
from pathlib import Path
from typing import Any

_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from app.api.errors import ClimaNoDisponibleError  # noqa: E402
from app.core import database  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.engine import clima_processor  # noqa: E402
from app.services import open_meteo  # noqa: E402
from app.services.datos_locales import ciudades  # noqa: E402
from app.services.open_meteo import OpenMeteoRateLimitError  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("precarga_cache")


def _celdas_por_poblacion() -> list[dict[str, Any]]:
    """Ordena ciudades por poblacion y deja una por celda 0.1°."""
    ordenadas = sorted(
        ciudades(),
        key=lambda c: int(c.get("poblacion") or 0),
        reverse=True,
    )
    vistos: set[tuple[float, float]] = set()
    celdas: list[dict[str, Any]] = []
    for c in ordenadas:
        lat_grid = round(float(c["lat"]), 1)
        lon_grid = round(float(c["lon"]), 1)
        clave = (lat_grid, lon_grid)
        if clave in vistos:
            continue
        vistos.add(clave)
        celdas.append({
            "nombre": c["nombre"],
            "estado": c["estado"],
            "lat": float(c["lat"]),
            "lon": float(c["lon"]),
            "lat_grid": lat_grid,
            "lon_grid": lon_grid,
            "altitud_m": int(c.get("altitud_m") or 0),
            "poblacion": int(c.get("poblacion") or 0),
        })
    return celdas


async def _ya_en_cache(lat_grid: float, lon_grid: float) -> bool:
    """True si la zona ya tiene clima de Open-Meteo. Las de origen "conagua" se vuelven a pedir
    para reemplazar el respaldo por el dato completo."""
    cache = await database.get_clima_cache(lat_grid, lon_grid)
    return cache is not None and cache.get("origen") == database.ORIGEN_OPEN_METEO


async def _precargar_celda(celda: dict[str, Any]) -> bool:
    diarios = await open_meteo.obtener_clima_diario(celda["lat"], celda["lon"])
    resumen = clima_processor.procesar_clima_diario(diarios)
    if len(resumen) < 12:
        raise ClimaNoDisponibleError()
    await database.save_clima_cache(
        celda["lat_grid"],
        celda["lon_grid"],
        celda["altitud_m"],
        open_meteo.PERIODO_REFERENCIA,
        resumen,
    )
    return True


async def main_async(limit: int, delay: float) -> int:
    await database.init_db()
    celdas = _celdas_por_poblacion()
    logger.info(
        "Ciudades unicas por celda 0.1°: %s. Objetivo: precargar hasta %s.",
        len(celdas),
        limit,
    )

    guardadas = 0
    omitidas = 0
    fallidas = 0
    i = 0
    while guardadas < limit and i < len(celdas):
        celda = celdas[i]
        i += 1
        etiqueta = f"{celda['nombre']}, {celda['estado']} ({celda['lat_grid']}, {celda['lon_grid']})"

        if await _ya_en_cache(celda["lat_grid"], celda["lon_grid"]):
            omitidas += 1
            logger.info("[%s/%s] Ya en cache, se omite: %s", i, len(celdas), etiqueta)
            continue

        intentos = 0
        while True:
            intentos += 1
            try:
                logger.info(
                    "Consultando Open-Meteo (periodo %s) para %s ...",
                    open_meteo.PERIODO_REFERENCIA,
                    etiqueta,
                )
                await _precargar_celda(celda)
                guardadas += 1
                logger.info(
                    "Guardada %s/%s: %s (poblacion %s)",
                    guardadas,
                    limit,
                    etiqueta,
                    celda["poblacion"],
                )
                break
            except OpenMeteoRateLimitError:
                espera = random.uniform(30.0, 60.0)
                logger.warning(
                    "Limite 429 de Open-Meteo en %s. Esperando %.0f s (intento %s)...",
                    etiqueta,
                    espera,
                    intentos,
                )
                await asyncio.sleep(espera)
                if intentos >= 5:
                    fallidas += 1
                    logger.error("Se agotaron los reintentos por 429 en %s", etiqueta)
                    break
            except ClimaNoDisponibleError:
                fallidas += 1
                logger.error("Clima no disponible para %s", etiqueta)
                break
            except Exception:
                fallidas += 1
                logger.exception("Error inesperado en %s", etiqueta)
                break

        if guardadas < limit and i < len(celdas):
            logger.info("Pausa de %.1f s antes de la siguiente consulta...", delay)
            await asyncio.sleep(delay)

    logger.info(
        "Listo. Guardadas: %s | Omitidas (ya en cache): %s | Fallidas: %s | DB: %s",
        guardadas,
        omitidas,
        fallidas,
        settings.DB_PATH,
    )
    return 0 if fallidas == 0 or guardadas > 0 else 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Precarga el clima historico de Open-Meteo en la cache SQLite.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Maximo de celdas nuevas a consultar (default: 100).",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=3.0,
        help="Segundos de pausa entre consultas exitosas (default: 3.0).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.limit < 1:
        logger.error("--limit debe ser al menos 1.")
        sys.exit(2)
    if args.delay < 0:
        logger.error("--delay no puede ser negativo.")
        sys.exit(2)
    codigo = asyncio.run(main_async(args.limit, args.delay))
    sys.exit(codigo)


if __name__ == "__main__":
    main()
