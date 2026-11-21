"""Descarga el resumen de Wikipedia en español de los 28 cultivos y genera data/wikipedia_resumenes.json.

Sirve como punto de partida para escribir `resumen` y `curiosidades` de cada ficha, y para la imagen.
⚠️ El texto de Wikipedia tiene licencia CC BY-SA 4.0: reescribirlo con nuestras palabras y citar la fuente.

Fuente: API REST de es.wikipedia.org (/api/rest_v1/page/summary/{titulo}).
Uso:    backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\descargar_wikipedia.py [--forzar]
"""
from __future__ import annotations

import argparse
import time
from urllib.parse import quote

from comun import DATA, cultivos_curados, guardar_json, hoy, leer_json, preparar, sesion

API = "https://es.wikipedia.org/api/rest_v1/page/summary/"
SALIDA = DATA / "wikipedia_resumenes.json"


def resumen(http, titulo: str) -> dict | None:
    for intento in range(1, 6):
        r = http.get(API + quote(titulo, safe=""), timeout=30, params={"redirect": "true"})
        if r.status_code != 429:
            break
        espera = int(r.headers.get("Retry-After", 0)) or 15 * intento
        print(f"  Wikipedia pidió esperar (429); espero {espera} s")
        time.sleep(espera)
    if r.status_code == 404:
        return None
    r.raise_for_status()
    d = r.json()
    if d.get("type") == "disambiguation":
        return None
    return {
        "titulo": d.get("title"),
        "extracto": d.get("extract"),
        "url": d.get("content_urls", {}).get("desktop", {}).get("page"),
        "imagen": (d.get("thumbnail") or {}).get("source"),
        "imagen_original": (d.get("originalimage") or {}).get("source"),
    }


def main() -> None:
    preparar()
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--forzar", action="store_true", help="volver a consultar los que ya están")
    args = ap.parse_args()

    print("Wikipedia en español")
    previos = {} if args.forzar or not SALIDA.exists() else leer_json(SALIDA).get("cultivos", {})
    http = sesion()
    salida, faltantes = {}, []
    for c in cultivos_curados():
        if c["id"] in previos:
            salida[c["id"]] = previos[c["id"]]
            continue
        datos = None
        for titulo in (c.get("wikipedia_titulo"), c["nombre_cientifico"].replace(" ", "_"), c["nombre"]):
            if titulo and (datos := resumen(http, titulo)):
                break
            time.sleep(0.5)
        if datos:
            salida[c["id"]] = datos
            print(f"  {c['id']:<15} -> {datos['titulo']}{'' if datos['imagen'] else '  (sin imagen)'}")
            guardar(salida, silencioso=True)  # se guarda el avance por si se corta
        else:
            faltantes.append(c["id"])
        time.sleep(1.5)  # ser amables con la API
    if faltantes:
        print(f"  ⚠️ Sin artículo: {', '.join(faltantes)}")
    guardar(salida)


def guardar(salida: dict, silencioso: bool = False) -> None:
    datos = {
        "fuente": "Wikipedia en español (API REST de resúmenes)",
        "licencia": "Texto CC BY-SA 4.0; cada imagen tiene su propia licencia en Wikimedia Commons",
        "generado": hoy(),
        "cultivos": salida,
    }
    if silencioso:
        import json
        SALIDA.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    else:
        guardar_json(datos, SALIDA)


if __name__ == "__main__":
    main()
