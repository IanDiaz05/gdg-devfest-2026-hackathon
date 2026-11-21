"""Descarga el cierre agrícola municipal del SIAP y genera data/siap_municipio.json.

Para cada municipio (clave INEGI `cvegeo`, la misma de data/ciudades.json) lista cuáles de
nuestros 28 cultivos se siembran ahí y en qué ciclo (Otoño-Invierno, Primavera-Verano, Perennes).
Sirve para el mensaje "En tu municipio sí se cultiva jitomate (Primavera-Verano)".

Fuente: SIAP / SADER, datos abiertos (nube.agricultura.gob.mx/datosAbiertos/Agricola.php).
Uso:    backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\descargar_siap.py [--anio 2024] [--forzar]
"""
from __future__ import annotations

import argparse

import pandas as pd

from comun import DATA, RAW, cultivos_curados, descargar, guardar_json, hoy, preparar

# El identificador "view" lo usa la página de datos abiertos del SIAP para el cierre agrícola municipal.
# Si deja de funcionar, buscar el enlace "Cierre <año>" en https://nube.agricultura.gob.mx/datosAbiertos/Agricola.php
URL = "https://nube.agricultura.gob.mx/index.php"
VIEW = "10AE434F-A2158368-A120BC5A-EDF4AFAA"


def main() -> None:
    preparar()
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--anio", type=int, default=2024)
    ap.add_argument("--forzar", action="store_true")
    args = ap.parse_args()

    print(f"SIAP cierre agrícola municipal {args.anio}")
    ruta = descargar(URL, RAW / "siap" / f"Cierre_agricola_mun_{args.anio}.csv",
                     params={"view": VIEW, "ANIO": args.anio}, forzar=args.forzar)
    df = pd.read_csv(ruta, encoding="latin-1", low_memory=False)
    if "Nomcultivo" not in df.columns:
        raise SystemExit(f"ERROR: el archivo no tiene el formato esperado. Columnas: {list(df.columns)[:10]}")

    nombre_a_ids: dict[str, list[str]] = {}
    for c in cultivos_curados():
        for n in c.get("siap_nombres", []):
            nombre_a_ids.setdefault(n, []).append(c["id"])
    no_encontrados = sorted(set(nombre_a_ids) - set(df["Nomcultivo"].unique()))
    if no_encontrados:
        print(f"  ⚠️ Nombres de cultivos_curados.json que no aparecen en el SIAP {args.anio}: {no_encontrados}")

    df = df[df["Nomcultivo"].isin(nombre_a_ids) & (df["Sembrada"] > 0)]
    municipios: dict[str, dict] = {}
    for fila in df.itertuples(index=False):
        cvegeo = f"{int(fila.Idestado):02d}{int(fila.Idmunicipio):03d}"
        m = municipios.setdefault(cvegeo, {"municipio": fila.Nommunicipio, "estado": fila.Nomestado, "cultivos": {}})
        for cid in nombre_a_ids[fila.Nomcultivo]:
            ciclos = m["cultivos"].setdefault(cid, [])
            if fila.Nomcicloproductivo not in ciclos:
                ciclos.append(fila.Nomcicloproductivo)
    for m in municipios.values():
        m["cultivos"] = {k: sorted(v) for k, v in sorted(m["cultivos"].items())}

    guardar_json({
        "fuente": f"SIAP, cierre de la producción agrícola por municipio {args.anio}",
        "anio": args.anio,
        "generado": hoy(),
        "nota": "Llave: cvegeo (clave INEGI de estado + municipio). Solo incluye los cultivos de cultivos_curados.json.",
        "municipios": dict(sorted(municipios.items())),
    }, DATA / "siap_municipio.json", compacto=True)

    print(f"  {len(municipios):,} municipios con al menos uno de nuestros cultivos. Ejemplos:")
    for cvegeo, nombre in (("15106", "Toluca"), ("31050", "Mérida")):
        m = municipios.get(cvegeo)
        print(f"    {nombre}: {m['cultivos'] if m else 'sin datos'}")


if __name__ == "__main__":
    main()
