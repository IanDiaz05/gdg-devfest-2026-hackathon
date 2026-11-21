"""Descarga GeoNames México y genera data/ciudades.json (reemplaza a la API de geocoding).

Incluye capitales, cabeceras municipales y localidades de 5,000 habitantes o más, con
estado, clave INEGI de estado y municipio, coordenadas, altitud y población.

Fuente: GeoNames (https://www.geonames.org), licencia CC BY 4.0.
Uso:    backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\descargar_ciudades.py [--forzar]
"""
from __future__ import annotations

import argparse
import csv
import io
import time
import zipfile

from comun import DATA, RAW, descargar, guardar_json, hoy, leer_json, normalizar, preparar, sesion

URL_MX = "https://download.geonames.org/export/dump/MX.zip"
URL_ADMIN1 = "https://download.geonames.org/export/dump/admin1CodesASCII.txt"
URL_INEGI_MUN = "https://gaia.inegi.org.mx/wscatgeo/v2/mgem/{cve}"  # catálogo de municipios por estado
POBLACION_MINIMA = 5000

# Clave INEGI del estado -> (nombre para mostrar, nombres alternativos normalizados)
ESTADOS_INEGI = {
    "01": ("Aguascalientes", []), "02": ("Baja California", []), "03": ("Baja California Sur", []),
    "04": ("Campeche", []), "05": ("Coahuila", ["coahuila de zaragoza"]), "06": ("Colima", []),
    "07": ("Chiapas", []), "08": ("Chihuahua", []),
    "09": ("Ciudad de México", ["mexico city", "distrito federal", "ciudad de mexico"]),
    "10": ("Durango", []), "11": ("Guanajuato", []), "12": ("Guerrero", []), "13": ("Hidalgo", []),
    "14": ("Jalisco", []), "15": ("Estado de México", ["mexico", "estado de mexico"]),
    "16": ("Michoacán", ["michoacan de ocampo"]), "17": ("Morelos", []), "18": ("Nayarit", []),
    "19": ("Nuevo León", []), "20": ("Oaxaca", []), "21": ("Puebla", []), "22": ("Querétaro", []),
    "23": ("Quintana Roo", []), "24": ("San Luis Potosí", []), "25": ("Sinaloa", []), "26": ("Sonora", []),
    "27": ("Tabasco", []), "28": ("Tamaulipas", []), "29": ("Tlaxcala", []),
    "30": ("Veracruz", ["veracruz de ignacio de la llave", "veracruz llave"]), "31": ("Yucatán", []),
    "32": ("Zacatecas", []),
}
TIPOS = {"PPLC": "capital_pais", "PPLA": "capital_estado", "PPLA2": "cabecera_municipal"}


def mapa_estados(ruta_admin1) -> dict[str, str]:
    """Código admin1 de GeoNames -> clave INEGI del estado."""
    por_nombre = {}
    for cve, (nombre, alias) in ESTADOS_INEGI.items():
        for n in [nombre, *alias]:
            por_nombre[normalizar(n)] = cve
    mapa, sin_mapear = {}, []
    with open(ruta_admin1, encoding="utf-8") as f:
        for linea in f:
            partes = linea.rstrip("\n").split("\t")
            if not partes[0].startswith("MX."):
                continue
            codigo = partes[0].split(".")[1]
            cve = por_nombre.get(normalizar(partes[1])) or por_nombre.get(normalizar(partes[2]))
            if cve:
                mapa[codigo] = cve
            else:
                sin_mapear.append(partes[1])
    if len(set(mapa.values())) != 32:
        raise SystemExit(f"ERROR: no se pudieron mapear todos los estados. Sin mapear: {sin_mapear}")
    return mapa


def nombres_municipios(forzar: bool) -> dict[str, str]:
    """cvegeo (clave INEGI estado+municipio) -> nombre oficial del municipio, del catálogo del INEGI.

    Se consulta una vez por estado (32 peticiones) y se guarda en data/raw/inegi/. Si el INEGI no
    responde, el municipio se queda con el nombre del lugar de GeoNames.
    """
    ruta = RAW / "inegi" / "municipios.json"
    if ruta.exists() and not forzar:
        return leer_json(ruta)
    http, salida = sesion(), {}
    for cve in ESTADOS_INEGI:
        try:
            r = http.get(URL_INEGI_MUN.format(cve=cve), timeout=60)
            r.raise_for_status()
            for m in r.json().get("datos", []):
                salida[m["cvegeo"]] = m["nomgeo"]
        except Exception as e:  # noqa: BLE001
            print(f"  ⚠️ INEGI no respondió para el estado {cve}: {e}")
        time.sleep(0.3)
    if salida:
        guardar_json(salida, ruta)
    print(f"  {len(salida):,} municipios con nombre oficial (INEGI)")
    return salida


def main() -> None:
    preparar()
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--forzar", action="store_true", help="volver a descargar aunque ya exista")
    args = ap.parse_args()

    print("Ciudades de México (GeoNames)")
    zip_mx = descargar(URL_MX, RAW / "geonames" / "MX.zip", forzar=args.forzar)
    admin1 = descargar(URL_ADMIN1, RAW / "geonames" / "admin1CodesASCII.txt", forzar=args.forzar)
    estados = mapa_estados(admin1)
    municipios = nombres_municipios(args.forzar)

    ciudades, vistos = [], set()
    with zipfile.ZipFile(zip_mx) as z:
        lector = csv.reader(io.TextIOWrapper(z.open("MX.txt"), encoding="utf-8"),
                            delimiter="\t", quoting=csv.QUOTE_NONE)
        filas = [r for r in lector if r[6] == "P"]  # solo lugares poblados
    filas.sort(key=lambda r: -int(r[14] or 0))
    for r in filas:
        codigo, poblacion = r[7], int(r[14] or 0)
        if codigo not in TIPOS and poblacion < POBLACION_MINIMA:
            continue
        cve_ent = estados.get(r[10])
        if not cve_ent:
            continue
        cve_mun = r[11].zfill(3) if r[11].isdigit() else None
        busqueda = normalizar(r[1])
        llave = (busqueda, cve_ent, cve_mun)
        if llave in vistos:  # mismo nombre en el mismo municipio: se queda el más poblado
            continue
        vistos.add(llave)
        altitud = int(r[16]) if r[16] not in ("", "-9999") else (int(r[15]) if r[15] else None)
        ciudades.append({
            "id": int(r[0]),
            "nombre": r[1],
            "busqueda": busqueda,
            "estado": ESTADOS_INEGI[cve_ent][0],
            "cve_ent": cve_ent,
            "cve_mun": cve_mun,
            "cvegeo": f"{cve_ent}{cve_mun}" if cve_mun else None,
            "municipio": municipios.get(f"{cve_ent}{cve_mun}", r[1]) if cve_mun else r[1],
            "lat": round(float(r[4]), 4),
            "lon": round(float(r[5]), 4),
            "altitud_m": altitud,
            "poblacion": poblacion,
            "tipo": TIPOS.get(codigo, "localidad"),
        })

    guardar_json({
        "fuente": "GeoNames (geonames.org), MX.zip",
        "licencia": "CC BY 4.0",
        "generado": hoy(),
        "criterio": f"capitales, cabeceras municipales y localidades con {POBLACION_MINIMA:,} habitantes o más",
        "total": len(ciudades),
        "ciudades": ciudades,
    }, DATA / "ciudades.json", compacto=True)

    print(f"  {len(ciudades):,} lugares. Ejemplos:")
    for q in ("toluca", "merida", "monterrey"):
        c = next(c for c in ciudades if c["busqueda"].startswith(q))
        print(f"    {q!r} -> {c['nombre']} (mun. {c['municipio']}), {c['estado']} | cvegeo {c['cvegeo']} | {c['altitud_m']} m | {c['poblacion']:,} hab.")


if __name__ == "__main__":
    main()
