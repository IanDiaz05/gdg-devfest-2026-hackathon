"""Convierte clima diario (Open-Meteo) o normales SMN en 12 resúmenes mensuales."""
from datetime import date
from statistics import mean
from typing import Any

from app.services.datos_locales import distancia_km, smn

MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
         "Septiembre", "Octubre", "Noviembre", "Diciembre"]
UMBRAL_HELADA_C = 2.0  # aire a 2 m; a ras de suelo ya puede helar
UMBRAL_HELADA_FUERTE_C = -2.0  # daña también a los cultivos que toleran heladas ligeras
RADIO_SMN_FALLBACK_KM = 100.0


def _pct(anios_con_evento: set[int], anios: set[int]) -> int:
    return int(round(100 * len(anios_con_evento) / len(anios))) if anios else 0


def _estimar_heladas_desde_tmin(tmin_c: float) -> tuple[int, int]:
    """Estima % de años con helada a partir de la mínima media mensual (sin diarios)."""
    if tmin_c <= UMBRAL_HELADA_FUERTE_C:
        return 100, 100
    if tmin_c <= 0.0:
        return 100, 50
    if tmin_c <= UMBRAL_HELADA_C:
        return 100, 0
    return 0, 0


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


def _lista_mes(normal: dict[str, Any], clave: str) -> list[Any]:
    valor = normal.get(clave) or []
    if not isinstance(valor, list):
        return [None] * 12
    if len(valor) >= 12:
        return valor[:12]
    return list(valor) + [None] * (12 - len(valor))


def estacion_smn_cercana(
    lat: float,
    lon: float,
    radio_max_km: float = RADIO_SMN_FALLBACK_KM,
) -> tuple[dict[str, Any], float, str] | None:
    """Estación SMN más cercana con temperatura media mensual completa."""
    datos = smn()
    if not datos:
        return None
    periodo = str(datos.get("periodo_normal") or "SMN-CONAGUA")
    candidatas: list[tuple[int, float, dict[str, Any]]] = []
    for e in datos.get("estaciones", []):
        normal = e.get("normal") or {}
        tmed = _lista_mes(normal, "tmed_c")
        if any(v is None for v in tmed):
            continue
        km = distancia_km(lat, lon, float(e["lat"]), float(e["lon"]))
        if km > radio_max_km:
            continue
        tmin = _lista_mes(normal, "tmin_c")
        tmax = _lista_mes(normal, "tmax_c")
        lluvia = _lista_mes(normal, "lluvia_mm")
        incompleto = sum(1 for v in (tmin + tmax + lluvia) if v is None)
        candidatas.append((incompleto, km, e))
    if not candidatas:
        return None
    _, km, estacion = min(candidatas, key=lambda c: (c[0], c[1]))
    return estacion, km, periodo


def resumen_desde_estacion_smn(estacion: dict[str, Any]) -> list[dict[str, Any]]:
    """Arma 12 resúmenes mensuales a partir de los promedios de una estación SMN."""
    normal = estacion.get("normal") or {}
    tmed = _lista_mes(normal, "tmed_c")
    tmin = _lista_mes(normal, "tmin_c")
    tmax = _lista_mes(normal, "tmax_c")
    lluvia = _lista_mes(normal, "lluvia_mm")
    resumen: list[dict[str, Any]] = []
    for m in range(1, 13):
        i = m - 1
        media = tmed[i]
        if media is None:
            continue
        min_v = float(tmin[i]) if tmin[i] is not None else float(media)
        max_v = float(tmax[i]) if tmax[i] is not None else float(media)
        helada_pct, fuerte_pct = _estimar_heladas_desde_tmin(min_v)
        lluvia_v = round(float(lluvia[i]), 1) if lluvia[i] is not None else None
        resumen.append({
            "mes": m,
            "nombre": MESES[m - 1],
            "temp_media_c": round(float(media), 1),
            "temp_min_promedio_c": round(min_v, 1),
            "temp_max_promedio_c": round(max_v, 1),
            "anios_con_helada_pct": helada_pct,
            "anios_con_helada_fuerte_pct": fuerte_pct,
            "lluvia_mm": lluvia_v,
        })
    return resumen


def resumen_smn_fallback(lat: float, lon: float) -> tuple[list[dict[str, Any]], str] | None:
    """Respaldo local cuando Open-Meteo no responde. No se guarda en la caché permanente."""
    hallada = estacion_smn_cercana(lat, lon)
    if hallada is None:
        return None
    estacion, _km, periodo_normal = hallada
    resumen = resumen_desde_estacion_smn(estacion)
    if len(resumen) < 12:
        return None
    periodo = f"SMN-CONAGUA {periodo_normal}" if periodo_normal != "SMN-CONAGUA" else "SMN-CONAGUA"
    return resumen, periodo
