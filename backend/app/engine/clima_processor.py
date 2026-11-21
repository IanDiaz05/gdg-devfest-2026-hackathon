"""Convierte 30 años de clima diario (Open-Meteo) en 12 resúmenes mensuales."""
from datetime import date
from statistics import mean
from typing import Any

MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
         "Septiembre", "Octubre", "Noviembre", "Diciembre"]
UMBRAL_HELADA_C = 2.0  # aire a 2 m; a ras de suelo ya puede helar
UMBRAL_HELADA_FUERTE_C = -2.0  # daña también a los cultivos que toleran heladas ligeras


def _pct(anios_con_evento: set[int], anios: set[int]) -> int:
    return int(round(100 * len(anios_con_evento) / len(anios))) if anios else 0


def procesar_clima_30_anios(datos_diarios: dict[str, list]) -> list[dict[str, Any]]:
    """`datos_diarios` es el bloque `daily` de Open-Meteo Historical.

    Por mes calcula: temperatura media, mínima y máxima promedio, % de años con al menos una
    noche de helada (<= 2 °C) y de helada fuerte (<= -2 °C), y lluvia promedio del mes.
    """
    fechas = datos_diarios.get("time") or []
    medias = datos_diarios.get("temperature_2m_mean") or []
    minimas = datos_diarios.get("temperature_2m_min") or []
    maximas = datos_diarios.get("temperature_2m_max") or []
    lluvias = datos_diarios.get("precipitation_sum") or []

    por_mes: dict[int, dict[str, Any]] = {
        m: {"media": [], "min": [], "max": [], "anios": set(), "helada": set(), "helada_fuerte": set(), "lluvia": {}}
        for m in range(1, 13)
    }
    for i, texto in enumerate(fechas):
        d = date.fromisoformat(texto)
        b = por_mes[d.month]
        b["anios"].add(d.year)
        if i < len(medias) and medias[i] is not None:
            b["media"].append(medias[i])
        if i < len(maximas) and maximas[i] is not None:
            b["max"].append(maximas[i])
        if i < len(minimas) and minimas[i] is not None:
            b["min"].append(minimas[i])
            if minimas[i] <= UMBRAL_HELADA_C:
                b["helada"].add(d.year)
            if minimas[i] <= UMBRAL_HELADA_FUERTE_C:
                b["helada_fuerte"].add(d.year)
        if i < len(lluvias) and lluvias[i] is not None:
            b["lluvia"][d.year] = b["lluvia"].get(d.year, 0.0) + lluvias[i]

    resumen = []
    for m in range(1, 13):
        b = por_mes[m]
        if not b["media"]:
            continue
        resumen.append({
            "mes": m,
            "nombre": MESES[m - 1],
            "temp_media_c": round(mean(b["media"]), 1),
            "temp_min_promedio_c": round(mean(b["min"]), 1) if b["min"] else round(mean(b["media"]), 1),
            "temp_max_promedio_c": round(mean(b["max"]), 1) if b["max"] else round(mean(b["media"]), 1),
            "anios_con_helada_pct": _pct(b["helada"], b["anios"]),
            "anios_con_helada_fuerte_pct": _pct(b["helada_fuerte"], b["anios"]),
            "lluvia_mm": round(mean(b["lluvia"].values()), 1) if b["lluvia"] else None,
        })
    return resumen
