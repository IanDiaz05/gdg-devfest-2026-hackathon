from __future__ import annotations

import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Any

_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from app.core.config import settings  # noqa: E402
from app.core.database import get_connection, init_db  # noqa: E402

logger = logging.getLogger("seed")

def _cargar_json(ruta: Path) -> Any | None:
    if not ruta.is_file():
        logger.warning("No se encontro el archivo %s. Se omite la carga.", ruta)
        return None
    with ruta.open(encoding="utf-8") as fh:
        return json.load(fh)


def _como_lista(payload: Any, clave: str) -> list[dict[str, Any]]:
    if payload is None:
        return []
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        interno = payload.get(clave)
        if isinstance(interno, list):
            return [item for item in interno if isinstance(item, dict)]
        if all(isinstance(v, dict) for v in payload.values()):
            filas: list[dict[str, Any]] = []
            for ident, valor in payload.items():
                fila = dict(valor)
                fila.setdefault("id", ident)
                filas.append(fila)
            return filas
    logger.warning("Formato inesperado en JSON de %s. Se omite.", clave)
    return []


def _reglas_de_cultivo(cultivo: dict[str, Any]) -> dict[str, Any]:
    if isinstance(cultivo.get("reglas"), dict):
        return cultivo["reglas"]
    ficha = cultivo.get("ficha_tecnica") or {}
    if not isinstance(ficha, dict):
        ficha = {}
    return {
        "temp_ideal_c": ficha.get("temp_ideal_c"),
        "temp_limite_c": ficha.get("temp_limite_c"),
        "tolera_helada": ficha.get("tolera_helada"),
        "altitud_max_m": ficha.get("altitud_max_m"),
        "dias_a_cosecha": ficha.get("dias_a_cosecha"),
        "maceta_min_litros": ficha.get("maceta_min_litros"),
        "luz": ficha.get("luz"),
        "perenne": cultivo.get("perenne", False),
    }


async def _upsert_cultivos() -> int:
    data_dir = settings.DATA_DIR
    if data_dir is None:
        raise RuntimeError("DATA_DIR no esta configurado.")
    # cultivos.json es el archivo curado a mano; si todavía no existe se usa el generado por
    # scripts/descargas/generar_cultivos_base.py
    ruta = data_dir / "cultivos.json"
    if not ruta.is_file():
        ruta = data_dir / "cultivos_base.json"
    logger.info("Leyendo cultivos de %s", ruta.name)
    payload = _cargar_json(ruta)
    if payload is None:
        return 0
    cultivos = _como_lista(payload, "cultivos")
    insertados = 0
    async with get_connection() as db:
        for cultivo in cultivos:
            cultivo_id = cultivo.get("id")
            if not cultivo_id:
                logger.warning("Cultivo sin id; se omite.")
                continue
            await db.execute(
                """
                INSERT OR REPLACE INTO cultivos (
                    id, nombre, icono, categoria, datos_json, reglas_json
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    str(cultivo_id),
                    str(cultivo.get("nombre") or cultivo_id),
                    str(cultivo.get("icono") or ""),
                    str(cultivo.get("categoria") or ""),
                    json.dumps(cultivo, ensure_ascii=False),
                    json.dumps(_reglas_de_cultivo(cultivo), ensure_ascii=False),
                ),
            )
            insertados += 1
        await db.commit()
    logger.info("Cargados %s cultivos.", insertados)
    return insertados


async def seed() -> None:
    await init_db()
    data_dir = settings.DATA_DIR
    if data_dir is None:
        raise RuntimeError("DATA_DIR no esta configurado.")
    await _upsert_cultivos()
    logger.info("Seed completado.")


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s: %(message)s",
    )
    asyncio.run(seed())


if __name__ == "__main__":
    main()
