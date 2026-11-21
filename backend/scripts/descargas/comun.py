"""Utilidades compartidas por los scripts de descarga.

Todos los scripts deben correrse con el Python de backend/.venv, por ejemplo:
    backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\descargar_todo.py
"""
from __future__ import annotations

import json
import sys
import time
import unicodedata
from datetime import date
from pathlib import Path

import requests

BACKEND = Path(__file__).resolve().parents[2]
DATA = BACKEND / "data"
RAW = DATA / "raw"  # descargas originales (no se suben a Git)
CURACION = DATA / "curacion"  # archivos escritos a mano por el equipo
CULTIVOS_CURADOS = CURACION / "cultivos_curados.json"

USER_AGENT = "QueSiembro-hackathon/0.1 (scripts de datos abiertos)"
MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
         "Septiembre", "Octubre", "Noviembre", "Diciembre"]


def preparar() -> None:
    """Verifica que se use backend/.venv y deja la consola en UTF-8."""
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    venv_esperado = (BACKEND / ".venv").resolve()
    if Path(sys.prefix).resolve() != venv_esperado:
        sys.exit(
            "ERROR: corre este script con el Python de backend/.venv\n"
            f"  Esperado: {venv_esperado}\n  Actual:   {sys.prefix}\n"
            "  Ejemplo: backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\descargar_todo.py"
        )


def sesion() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = USER_AGENT
    return s


def descargar(url: str, destino: Path, *, forzar: bool = False, params: dict | None = None,
              timeout: int = 180, intentos: int = 4, http: requests.Session | None = None) -> Path:
    """Descarga `url` a `destino`. Si ya existe y no se pide `forzar`, no vuelve a descargar."""
    if destino.exists() and destino.stat().st_size > 0 and not forzar:
        print(f"  ya existe, se reutiliza: {destino.relative_to(BACKEND)}")
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    http = http or sesion()
    ultimo_error: Exception | None = None
    for intento in range(1, intentos + 1):
        try:
            r = http.get(url, params=params, timeout=timeout, stream=True)
            if r.status_code == 429 or r.status_code >= 500:
                raise requests.HTTPError(f"HTTP {r.status_code}")
            r.raise_for_status()
            temporal = destino.with_suffix(destino.suffix + ".parcial")
            with open(temporal, "wb") as f:
                for bloque in r.iter_content(1 << 16):
                    f.write(bloque)
            temporal.replace(destino)
            print(f"  descargado: {destino.relative_to(BACKEND)} ({destino.stat().st_size / 1024:,.0f} KB)")
            return destino
        except (requests.RequestException, OSError) as e:
            ultimo_error = e
            espera = 5 * intento
            print(f"  intento {intento}/{intentos} falló ({e}); reintento en {espera} s")
            time.sleep(espera)
    raise RuntimeError(f"No se pudo descargar {url}: {ultimo_error}")


def normalizar(texto: str) -> str:
    """Minúsculas, sin acentos y con espacios simples (para buscar y cruzar nombres)."""
    t = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode()
    return " ".join(t.lower().replace("-", " ").split())


def leer_json(ruta: Path):
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def guardar_json(datos, ruta: Path, *, compacto: bool = False) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    with open(ruta, "w", encoding="utf-8", newline="\n") as f:
        if compacto:
            json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(datos, f, ensure_ascii=False, indent=2)
            f.write("\n")
    print(f"  guardado: {ruta.relative_to(BACKEND)} ({ruta.stat().st_size / 1024:,.0f} KB)")


def cultivos_curados() -> list[dict]:
    return leer_json(CULTIVOS_CURADOS)["cultivos"]


def hoy() -> str:
    return date.today().isoformat()
