"""Lectura de los datasets descargados en backend/data (sin red).

Los archivos se cargan una vez y se vuelven a leer solo si cambian en disco, así la
descarga mensual del SMN se refleja sin reiniciar la API.
"""
import json
import math
import unicodedata
from pathlib import Path
from typing import Any

from app.core.config import settings

_CACHE: dict[str, tuple[float, Any]] = {}


def _cargar(nombre: str) -> Any | None:
    ruta = Path(settings.DATA_DIR) / nombre
    if not ruta.is_file():
        return None
    mtime = ruta.stat().st_mtime
    guardado = _CACHE.get(nombre)
    if guardado and guardado[0] == mtime:
        return guardado[1]
    with ruta.open(encoding="utf-8") as fh:
        datos = json.load(fh)
    _CACHE[nombre] = (mtime, datos)
    return datos


def normalizar(texto: str) -> str:
    """Minúsculas, sin acentos y con espacios simples (igual que scripts/descargas/comun.py)."""
    t = unicodedata.normalize("NFKD", str(texto or "")).encode("ascii", "ignore").decode()
    return " ".join(t.lower().replace("-", " ").split())


def distancia_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distancia aproximada (equirectangular); suficiente para distancias de decenas de km."""
    x = math.radians(lon2 - lon1) * math.cos(math.radians((lat1 + lat2) / 2))
    y = math.radians(lat2 - lat1)
    return 6371.0 * math.hypot(x, y)


def ciudades() -> list[dict[str, Any]]:
    datos = _cargar("ciudades.json") or {}
    return datos.get("ciudades", [])


def smn() -> dict[str, Any] | None:
    return _cargar("smn_estaciones.json")
