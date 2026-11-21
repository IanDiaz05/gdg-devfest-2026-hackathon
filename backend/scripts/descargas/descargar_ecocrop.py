"""Descarga FAO ECOCROP y extrae los requisitos de los 28 cultivos de data/curacion/cultivos_curados.json.

Genera data/ecocrop_cultivos.json con temperatura ideal y límite, días de ciclo, altitud máxima,
lluvia anual, pH y tipo de ciclo de cada cultivo.

Fuente: FAO ECOCROP (copia en https://github.com/OpenCLIM/ecocrop).
Uso:    backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\descargar_ecocrop.py [--forzar]
"""
from __future__ import annotations

import argparse

import pandas as pd

from comun import DATA, RAW, cultivos_curados, descargar, guardar_json, hoy, preparar

URL = "https://raw.githubusercontent.com/OpenCLIM/ecocrop/main/EcoCrop_DB.csv"


def rango(fila, a, b):
    va, vb = fila.get(a), fila.get(b)
    if pd.isna(va) or pd.isna(vb):
        return None
    return [round(float(va), 1), round(float(vb), 1)]


def valor(fila, campo):
    v = fila.get(campo)
    return None if pd.isna(v) else (v.strip() if isinstance(v, str) else float(v))


def main() -> None:
    preparar()
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--forzar", action="store_true")
    args = ap.parse_args()

    print("FAO ECOCROP")
    ruta = descargar(URL, RAW / "ecocrop" / "EcoCrop_DB.csv", forzar=args.forzar)
    eco = pd.read_csv(ruta, encoding="latin-1")
    eco["ScientificName"] = eco["ScientificName"].str.strip()

    salida, faltantes = {}, []
    for c in cultivos_curados():
        nombre = c["ecocrop_nombre"]
        filas = eco[eco.ScientificName == nombre]
        if filas.empty:
            filas = eco[eco.ScientificName.str.startswith(nombre)]
        if filas.empty:
            faltantes.append(f"{c['id']} ({nombre})")
            continue
        f = filas.iloc[0]
        ciclo = rango(f, "GMIN", "GMAX")
        salida[c["id"]] = {
            "ecocrop_nombre": f.ScientificName,
            "temp_ideal_c": rango(f, "TOPMN", "TOPMX"),
            "temp_limite_c": rango(f, "TMIN", "TMAX"),
            "temp_muerte_c": valor(f, "KTMP"),
            "dias_ciclo": ciclo if ciclo and ciclo[1] > 0 else None,
            "altitud_max_m": None if pd.isna(f.get("ALTMX")) else int(f["ALTMX"]),
            "lluvia_anual_ideal_mm": rango(f, "ROPMN", "ROPMX"),
            "ph_ideal": rango(f, "PHOPMN", "PHOPMX"),
            "ciclo_vida": valor(f, "LISPA"),
            "luz_ideal": [valor(f, "LIOPMN"), valor(f, "LIOPMX")],
            "coincidencias_en_ecocrop": int(len(filas)),
        }
        print(f"  {c['id']:<15} -> {f.ScientificName:<32} ideal {salida[c['id']]['temp_ideal_c']} °C")

    if faltantes:
        print(f"  ⚠️ No están en ECOCROP: {', '.join(faltantes)}")
    guardar_json({
        "fuente": "FAO ECOCROP (EcoCrop_DB.csv, copia de OpenCLIM)",
        "generado": hoy(),
        "nota": "Rangos de temperatura en °C sobre la temperatura media del periodo de cultivo. Revisar a mano los marcados en las notas de cultivos_curados.json.",
        "cultivos": salida,
    }, DATA / "ecocrop_cultivos.json")


if __name__ == "__main__":
    main()
