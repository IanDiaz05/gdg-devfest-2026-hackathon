from __future__ import annotations

import asyncio
import json
import logging
import sys
import unicodedata
from pathlib import Path
from typing import Any

_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from app.core.config import settings  # noqa: E402
from app.core.database import get_connection, init_db  # noqa: E402

logger = logging.getLogger("seed")

_NIVELES = {
    "D0": "Anormalmente seco",
    "D1": "Sequia moderada",
    "D2": "Sequia severa",
    "D3": "Sequia extrema",
    "D4": "Sequia excepcional",
}


def _normalizar(texto: str) -> str:
    descompuesto = unicodedata.normalize("NFD", texto or "")
    sin_marcas = "".join(
        c for c in descompuesto if unicodedata.category(c) != "Mn"
    )
    return " ".join(sin_marcas.lower().split())


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


def _indice_sniim(payload: Any) -> dict[str, Any]:
    if payload is None:
        return {}
    if isinstance(payload, dict):
        interno = payload.get("perfiles")
        if isinstance(interno, list):
            payload = interno
        elif all(isinstance(v, dict) for v in payload.values()):
            return {
                str(clave): valor
                for clave, valor in payload.items()
                if clave != "perfiles"
            }
    if isinstance(payload, list):
        indice: dict[str, Any] = {}
        for item in payload:
            if not isinstance(item, dict):
                continue
            ident = item.get("id") or item.get("cultivo_id")
            if ident:
                indice[str(ident)] = item
        return indice
    return {}


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


def _sniim_de_cultivo(
    cultivo: dict[str, Any], perfiles: dict[str, Any]
) -> Any | None:
    ident = str(cultivo.get("id") or "")
    if ident and ident in perfiles:
        perfil = perfiles[ident]
        if perfil.get("contexto_economico_sniim") is not None:
            return perfil.get("contexto_economico_sniim")
        return perfil
    if cultivo.get("contexto_economico_sniim") is not None:
        return cultivo.get("contexto_economico_sniim")
    if cultivo.get("sniim") is not None:
        return cultivo.get("sniim")
    return None


def _clave_sequia(fila: dict[str, Any]) -> str:
    if fila.get("clave_normalizada"):
        return str(fila["clave_normalizada"])
    estado = str(fila.get("estado") or "")
    municipio = str(fila.get("municipio") or "")
    return f"{_normalizar(estado)}|{_normalizar(municipio)}"


async def _upsert_cultivos(perfiles: dict[str, Any]) -> int:
    data_dir = settings.DATA_DIR
    if data_dir is None:
        raise RuntimeError("DATA_DIR no esta configurado.")
    payload = _cargar_json(data_dir / "cultivos.json")
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
            sniim = _sniim_de_cultivo(cultivo, perfiles)
            await db.execute(
                """
                INSERT OR REPLACE INTO cultivos (
                    id, nombre, icono, categoria, datos_json, reglas_json, sniim_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(cultivo_id),
                    str(cultivo.get("nombre") or cultivo_id),
                    str(cultivo.get("icono") or ""),
                    str(cultivo.get("categoria") or ""),
                    json.dumps(cultivo, ensure_ascii=False),
                    json.dumps(_reglas_de_cultivo(cultivo), ensure_ascii=False),
                    None if sniim is None else json.dumps(sniim, ensure_ascii=False),
                ),
            )
            insertados += 1
        await db.commit()
    logger.info("Cargados %s cultivos.", insertados)
    return insertados


async def _upsert_sequia() -> int:
    data_dir = settings.DATA_DIR
    if data_dir is None:
        raise RuntimeError("DATA_DIR no esta configurado.")
    payload = _cargar_json(data_dir / "sequia.json")
    if payload is None:
        return 0
    filas = _como_lista(payload, "municipios")
    if not filas:
        filas = _como_lista(payload, "sequia")
    insertados = 0
    async with get_connection() as db:
        for fila in filas:
            estado = str(fila.get("estado") or "")
            municipio = str(fila.get("municipio") or "")
            nivel = str(fila.get("nivel") or "")
            nivel_nombre = str(
                fila.get("nivel_nombre") or _NIVELES.get(nivel, "")
            )
            fecha_dato = str(fila.get("fecha_dato") or "")
            clave = _clave_sequia(fila)
            if not clave or clave == "|":
                logger.warning("Registro de sequia sin clave; se omite.")
                continue
            await db.execute(
                """
                INSERT OR REPLACE INTO sequia_municipios (
                    clave_normalizada, estado, municipio, nivel, nivel_nombre, fecha_dato
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (clave, estado, municipio, nivel, nivel_nombre, fecha_dato),
            )
            insertados += 1
        await db.commit()
    logger.info("Cargados %s municipios de sequia.", insertados)
    return insertados


async def seed() -> None:
    await init_db()
    data_dir = settings.DATA_DIR
    if data_dir is None:
        raise RuntimeError("DATA_DIR no esta configurado.")
    perfiles = _indice_sniim(_cargar_json(data_dir / "sniim_perfiles.json"))
    await _upsert_cultivos(perfiles)
    await _upsert_sequia()
    logger.info("Seed completado.")


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s: %(message)s",
    )
    asyncio.run(seed())


if __name__ == "__main__":
    main()
