"""Lluvia del último mes publicado por el SMN (CONAGUA) en la estación más cercana.

Usa data/smn_estaciones.json, que genera scripts/descargas/descargar_smn.py una vez al mes.
Compara la lluvia del último mes contra el promedio de ese mes en la misma estación (2013 al año pasado).
"""
from typing import Any

from app.services.datos_locales import distancia_km, smn

RADIO_MAX_KM = 30
_MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
          "septiembre", "octubre", "noviembre", "diciembre"]


def _consejo(anomalia: int | None) -> str:
    if anomalia is None:
        return "Revisa la humedad de la tierra con el dedo antes de regar."
    if anomalia <= -30:
        return "Ha llovido menos de lo normal: riega temprano y cubre la tierra con hojas secas para guardar humedad."
    if anomalia >= 30:
        return "Ha llovido más de lo normal: revisa que tus macetas drenen bien y no dejes agua en los platos."
    return "La lluvia ha estado dentro de lo normal para tu zona."


def obtener_lluvia_reciente(lat: float, lon: float) -> dict[str, Any] | None:
    datos = smn()
    if not datos:
        return None
    ultimo_mes = str(datos.get("ultimo_mes") or "")
    try:
        anio, mes = int(ultimo_mes[:4]), int(ultimo_mes[5:7])
    except ValueError:
        return None

    candidatas = []
    for e in datos.get("estaciones", []):
        ultimo = e.get("ultimo") or {}
        if ultimo.get("lluvia_mm") is None:
            continue
        km = distancia_km(lat, lon, e["lat"], e["lon"])
        if km <= RADIO_MAX_KM:
            # se prefiere la estación cercana que además tenga promedio para ese mes
            normal = (e.get("normal") or {}).get("lluvia_mm") or [None] * 12
            candidatas.append((normal[mes - 1] is None, km, e))
    if not candidatas:
        return None
    _, km, e = min(candidatas, key=lambda c: (c[0], c[1]))

    ultimo = e["ultimo"]
    normal = (e.get("normal") or {}).get("lluvia_mm") or [None] * 12
    normal_mm = normal[mes - 1]
    lluvia = float(ultimo["lluvia_mm"])
    anomalia = None
    if normal_mm is not None and normal_mm >= 5:  # con menos de 5 mm el % no dice nada
        anomalia = int(round(100 * (lluvia / normal_mm - 1)))

    texto = f"En {_MESES[mes - 1]} de {anio} llovieron {lluvia:.0f} mm en {e['nombre']} ({km:.0f} km)"
    if anomalia is not None:
        if abs(anomalia) < 10:
            texto += ", casi lo normal."
        else:
            texto += f": {abs(anomalia)}% {'más' if anomalia > 0 else 'menos'} de lo normal."
    else:
        texto += "."

    return {
        "fuente": "SMN - CONAGUA",
        "estacion": e["nombre"],
        "distancia_km": round(km, 1),
        "mes": ultimo_mes,
        "lluvia_mm": round(lluvia, 1),
        "normal_mm": normal_mm,
        "anomalia_pct": anomalia,
        "temp_min_c": ultimo.get("tmin_c"),
        "temp_max_c": ultimo.get("tmax_c"),
        "mensaje": texto,
        "consejo": _consejo(anomalia),
    }
