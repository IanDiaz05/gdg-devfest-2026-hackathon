"""Corre todas las descargas y genera los archivos de backend/data en orden.

Uso (desde la raíz del repo):
    backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\descargar_todo.py
    backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\descargar_todo.py --sin-siap

Los archivos ya descargados en data/raw/ se reutilizan. Para volver a bajar todo: --forzar.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

from comun import preparar

AQUI = Path(__file__).resolve().parent
PASOS = [
    ("ciudades", "descargar_ciudades.py", "GeoNames -> data/ciudades.json"),
    ("ecocrop", "descargar_ecocrop.py", "FAO ECOCROP -> data/ecocrop_cultivos.json"),
    ("wikipedia", "descargar_wikipedia.py", "Wikipedia -> data/wikipedia_resumenes.json"),
    ("siap", "descargar_siap.py", "SIAP -> data/siap_municipio.json"),
    ("base", "generar_cultivos_base.py", "Todo -> data/cultivos_base.json"),
]


def main() -> None:
    preparar()
    ap = argparse.ArgumentParser(description=__doc__)
    for clave, _, desc in PASOS:
        ap.add_argument(f"--sin-{clave}", action="store_true", help=f"saltar: {desc}")
    ap.add_argument("--forzar", action="store_true", help="volver a descargar todo")
    args = ap.parse_args()

    fallos = []
    for clave, script, desc in PASOS:
        if getattr(args, f"sin_{clave}"):
            print(f"\n=== {desc}: saltado ===", flush=True)
            continue
        print(f"\n=== {desc} ===", flush=True)
        inicio = time.time()
        extra = ["--forzar"] if args.forzar and clave != "base" else []
        r = subprocess.run([sys.executable, str(AQUI / script), *extra])
        print(f"--- {clave}: {'OK' if r.returncode == 0 else 'FALLÓ'} en {time.time() - inicio:.0f} s", flush=True)
        if r.returncode != 0:
            fallos.append(clave)
    if fallos:
        sys.exit(f"\nTerminó con errores en: {', '.join(fallos)}")
    print("\nListo: todos los archivos están en backend/data/")


if __name__ == "__main__":
    main()
