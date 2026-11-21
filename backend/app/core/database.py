import json
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, AsyncIterator

import aiosqlite

from app.core.config import settings

logger = logging.getLogger(__name__)

_CREATE_CULTIVOS = """
CREATE TABLE IF NOT EXISTS cultivos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    icono TEXT NOT NULL,
    categoria TEXT NOT NULL,
    datos_json TEXT NOT NULL,
    reglas_json TEXT NOT NULL
)
"""

_CREATE_CLIMA = """
CREATE TABLE IF NOT EXISTS clima_historico_cache (
    lat_grid REAL NOT NULL,
    lon_grid REAL NOT NULL,
    altitud_m INTEGER NOT NULL,
    periodo_referencia TEXT NOT NULL,
    resumen_mensual_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    origen TEXT NOT NULL DEFAULT 'open-meteo',
    fuente_json TEXT,
    PRIMARY KEY (lat_grid, lon_grid)
)
"""

# Columnas agregadas después de crear la tabla: se añaden solas a las bases de datos que ya existen
_COLUMNAS_CLIMA_NUEVAS = {
    "origen": "TEXT NOT NULL DEFAULT 'open-meteo'",  # 'open-meteo' o 'conagua'
    "fuente_json": "TEXT",  # con 'conagua': estación usada, distancia y si la helada es estimada
}

ORIGEN_OPEN_METEO = "open-meteo"
ORIGEN_CONAGUA = "conagua"

_CREATE_PRONOSTICO = """
CREATE TABLE IF NOT EXISTS pronostico_7d_cache (
    lat_grid REAL NOT NULL,
    lon_grid REAL NOT NULL,
    alertas_json TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    PRIMARY KEY (lat_grid, lon_grid)
)
"""


def _parse_json(value: str | None) -> Any:
    if value is None:
        return None
    return json.loads(value)


def _cultivo_from_row(row: aiosqlite.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "nombre": row["nombre"],
        "icono": row["icono"],
        "categoria": row["categoria"],
        "datos_json": _parse_json(row["datos_json"]),
        "reglas_json": _parse_json(row["reglas_json"]),
    }


@asynccontextmanager
async def get_connection() -> AsyncIterator[aiosqlite.Connection]:
    db_path = settings.DB_PATH
    if db_path is None:
        raise RuntimeError("DB_PATH no esta configurado.")
    db_path.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(str(db_path)) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def init_db() -> None:
    async with get_connection() as db:
        await db.execute(_CREATE_CULTIVOS)
        await db.execute(_CREATE_CLIMA)
        await db.execute(_CREATE_PRONOSTICO)
        async with db.execute("PRAGMA table_info(clima_historico_cache)") as cursor:
            existentes = {row["name"] for row in await cursor.fetchall()}
        for columna, tipo in _COLUMNAS_CLIMA_NUEVAS.items():
            if columna not in existentes:
                await db.execute(f"ALTER TABLE clima_historico_cache ADD COLUMN {columna} {tipo}")
        await db.commit()
    logger.info("Tablas SQLite listas en %s", settings.DB_PATH)


async def get_all_cultivos() -> list[dict[str, Any]]:
    async with get_connection() as db:
        async with db.execute("SELECT * FROM cultivos ORDER BY nombre") as cursor:
            rows = await cursor.fetchall()
    return [_cultivo_from_row(row) for row in rows]


async def get_cultivo_by_id(cultivo_id: str) -> dict[str, Any] | None:
    async with get_connection() as db:
        async with db.execute(
            "SELECT * FROM cultivos WHERE id = ?",
            (cultivo_id,),
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        return None
    return _cultivo_from_row(row)


async def get_clima_cache(lat_grid: float, lon_grid: float) -> dict[str, Any] | None:
    async with get_connection() as db:
        async with db.execute(
            """
            SELECT lat_grid, lon_grid, altitud_m, periodo_referencia,
                   resumen_mensual_json, created_at, origen, fuente_json
            FROM clima_historico_cache
            WHERE lat_grid = ? AND lon_grid = ?
            """,
            (lat_grid, lon_grid),
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        return None
    return {
        "lat_grid": row["lat_grid"],
        "lon_grid": row["lon_grid"],
        "altitud_m": row["altitud_m"],
        "periodo_referencia": row["periodo_referencia"],
        "resumen_mensual_json": _parse_json(row["resumen_mensual_json"]),
        "created_at": row["created_at"],
        "origen": row["origen"] or ORIGEN_OPEN_METEO,
        "fuente": _parse_json(row["fuente_json"]),
    }


async def save_clima_cache(
    lat_grid: float,
    lon_grid: float,
    altitud_m: int,
    periodo_referencia: str,
    resumen_mensual: list[dict[str, Any]],
    origen: str = ORIGEN_OPEN_METEO,
    fuente: dict[str, Any] | None = None,
) -> None:
    created_at = datetime.now(timezone.utc).isoformat()
    payload = json.dumps(resumen_mensual, ensure_ascii=False)
    fuente_json = json.dumps(fuente, ensure_ascii=False) if fuente is not None else None
    try:
        async with get_connection() as db:
            await db.execute(
                """
                INSERT OR REPLACE INTO clima_historico_cache (
                    lat_grid, lon_grid, altitud_m, periodo_referencia,
                    resumen_mensual_json, created_at, origen, fuente_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (lat_grid, lon_grid, altitud_m, periodo_referencia, payload, created_at, origen, fuente_json),
            )
            await db.commit()
    except aiosqlite.Error:
        # La caché es una optimización: si no se puede escribir (p. ej. base de solo lectura), se sigue sin guardar
        logger.warning("No se pudo guardar en la caché (%s)", "save_clima_cache", exc_info=True)


async def get_pronostico_cache(
    lat_grid: float, lon_grid: float, incluir_vencido: bool = False
) -> list[dict[str, Any]] | None:
    ahora = int(time.time())
    async with get_connection() as db:
        async with db.execute(
            """
            SELECT alertas_json, expires_at
            FROM pronostico_7d_cache
            WHERE lat_grid = ? AND lon_grid = ?
            """,
            (lat_grid, lon_grid),
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        return None
    if int(row["expires_at"]) < ahora and not incluir_vencido:
        return None
    parsed = _parse_json(row["alertas_json"])
    if not isinstance(parsed, list):
        logger.error("alertas_json invalido en caché de pronostico.")
        return None
    return parsed


async def save_pronostico_cache(
    lat_grid: float,
    lon_grid: float,
    alertas: list[dict[str, Any]],
    ttl_seconds: int,
) -> None:
    expires_at = int(time.time()) + ttl_seconds
    payload = json.dumps(alertas, ensure_ascii=False)
    try:
        async with get_connection() as db:
            await db.execute(
                """
                INSERT OR REPLACE INTO pronostico_7d_cache (
                    lat_grid, lon_grid, alertas_json, expires_at
                ) VALUES (?, ?, ?, ?)
                """,
                (lat_grid, lon_grid, payload, expires_at),
            )
            await db.commit()
    except aiosqlite.Error:
        # La caché es una optimización: si no se puede escribir (p. ej. base de solo lectura), se sigue sin guardar
        logger.warning("No se pudo guardar en la caché (%s)", "save_pronostico_cache", exc_info=True)
