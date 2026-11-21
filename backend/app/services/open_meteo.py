"""Ubicación (data/ciudades.json) y clima (Open-Meteo).

- Búsqueda de ciudades: sin API, en data/ciudades.json (GeoNames + nombres de municipio del INEGI).
- Clima de 10 años: Open-Meteo Historical (archive-api.open-meteo.com).
- Pronóstico de 7 días: Open-Meteo Forecast (api.open-meteo.com).
"""
from typing import Any

import httpx

from app.api.errors import CiudadNoEncontradaError, ClimaNoDisponibleError
from app.engine import alertas as motor_alertas
from app.services.datos_locales import ciudades, distancia_km, normalizar

URL_HISTORICO = "https://archive-api.open-meteo.com/v1/archive"
URL_PRONOSTICO = "https://api.open-meteo.com/v1/forecast"
PERIODO_INICIO, PERIODO_FIN = "2016-01-01", "2025-12-31"
PERIODO_REFERENCIA = "2016-2025"
TIMEOUT_S = 90
MAX_ALTERNATIVAS = 3
RADIO_GPS_KM = 20  # si la ciudad más cercana está más lejos, se muestra "Tu ubicación"


class OpenMeteoRateLimitError(ClimaNoDisponibleError):
    """Open-Meteo respondió 429 (límite de peticiones)."""


def _ubicacion(c: dict[str, Any], alternativas: list[dict[str, Any]], nombre: str | None = None,
               lat: float | None = None, lon: float | None = None) -> dict[str, Any]:
    return {
        "nombre": nombre or c["nombre"],
        "municipio": c.get("municipio") or c["nombre"],
        "estado": c["estado"],
        "cvegeo": c.get("cvegeo"),
        "lat": lat if lat is not None else c["lat"],
        "lon": lon if lon is not None else c["lon"],
        "altitud_m": int(c.get("altitud_m") or 0),
        "alternativas": alternativas,
    }


def _alternativa(c: dict[str, Any]) -> dict[str, Any]:
    return {"nombre": c["nombre"], "estado": c["estado"], "lat": c["lat"], "lon": c["lon"]}


async def buscar_ubicacion(q: str) -> dict:
    """Busca `q` en data/ciudades.json. Acepta 'Toluca' o 'Toluca, Estado de México'."""
    if q is None or not str(q).strip():
        raise CiudadNoEncontradaError()
    partes = [normalizar(p) for p in str(q).split(",")]
    texto, filtro_estado = partes[0], (partes[1] if len(partes) > 1 else "")
    if not texto:
        raise CiudadNoEncontradaError()

    candidatos = []
    for c in ciudades():
        if filtro_estado and filtro_estado not in normalizar(c["estado"]):
            continue
        nombre = c["busqueda"]
        if nombre == texto:
            rango = 0
        elif nombre.startswith(texto):
            rango = 1
        elif f" {texto}" in f" {nombre}":
            rango = 2
        else:
            continue
        candidatos.append((rango, -int(c.get("poblacion") or 0), c))
    if not candidatos:
        raise CiudadNoEncontradaError()
    candidatos.sort(key=lambda x: (x[0], x[1]))
    principal = candidatos[0][2]
    alternativas, vistos = [], {(principal["nombre"], principal["estado"])}
    for _, _, c in candidatos[1:]:
        if (c["nombre"], c["estado"]) in vistos:
            continue
        vistos.add((c["nombre"], c["estado"]))
        alternativas.append(_alternativa(c))
        if len(alternativas) == MAX_ALTERNATIVAS:
            break
    return _ubicacion(principal, alternativas)


def sugerir_ciudades(q: str | None, limite: int = 10) -> list[dict[str, Any]]:
    """Sugerencias para el buscador, en orden alfabético.

    - Sin texto: las primeras `limite` del catálogo (A, B, C…).
    - Con texto (sin importar acentos ni mayúsculas): primero las que empiezan así, luego las que
      tienen una palabra que empieza así ("carmen" → Playa del Carmen) y al final las del estado
      ("yuc" → ciudades de Yucatán). Dentro de cada grupo, alfabético.
    - Acepta "ciudad, estado" para filtrar por estado ("san juan, jal").
    Cada lugar aparece una vez por estado (el más poblado si hay varios con el mismo nombre).
    """
    partes = [normalizar(p) for p in str(q or "").split(",")]
    texto, filtro_estado = partes[0], (partes[1] if len(partes) > 1 else "")

    mejores: dict[tuple[str, str], tuple[int, dict[str, Any]]] = {}
    for c in ciudades():
        estado = normalizar(c["estado"])
        if filtro_estado and not estado.startswith(filtro_estado) and f" {filtro_estado}" not in f" {estado}":
            continue
        nombre = c["busqueda"]
        if not texto or nombre.startswith(texto):
            rango = 0
        elif f" {texto}" in f" {nombre}":
            rango = 1
        elif not filtro_estado and (estado.startswith(texto) or f" {texto}" in f" {estado}"):
            rango = 2
        else:
            continue
        llave = (nombre, estado)
        previo = mejores.get(llave)
        if previo is None or (rango, -int(c.get("poblacion") or 0)) < (previo[0], -int(previo[1].get("poblacion") or 0)):
            mejores[llave] = (rango, c)

    ordenadas = sorted(mejores.items(), key=lambda item: (item[1][0], item[0][0], item[0][1]))
    return [
        {
            "nombre": c["nombre"],
            "estado": c["estado"],
            "municipio": c.get("municipio") or c["nombre"],
            "etiqueta": f"{c['nombre']}, {c['estado']}",
            "lat": c["lat"],
            "lon": c["lon"],
        }
        for _, (_, c) in ordenadas[:limite]
    ]


async def resolver_coordenadas(lat: float, lon: float) -> dict:
    """Para el GPS del navegador: toma los datos de la ciudad más cercana en data/ciudades.json."""
    try:
        lat_n = float(lat)
        lon_n = float(lon)
    except (TypeError, ValueError) as exc:
        raise CiudadNoEncontradaError() from exc
    if not (14.0 <= lat_n <= 33.5 and -118.5 <= lon_n <= -86.0):
        raise CiudadNoEncontradaError()
    lista = [
        c
        for c in ciudades()
        if isinstance(c.get("lat"), (int, float)) and isinstance(c.get("lon"), (int, float))
    ]
    if not lista:
        raise CiudadNoEncontradaError()
    cercana = min(lista, key=lambda c: distancia_km(lat_n, lon_n, c["lat"], c["lon"]))
    km = distancia_km(lat_n, lon_n, cercana["lat"], cercana["lon"])
    nombre = cercana["nombre"] if km <= RADIO_GPS_KM else "Tu ubicación"
    return _ubicacion(cercana, [], nombre=nombre, lat=lat_n, lon=lon_n)


async def _get(url: str, params: dict[str, Any]) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_S) as cliente:
            r = await cliente.get(url, params=params)
    except httpx.HTTPError as e:
        raise ClimaNoDisponibleError() from e
    if r.status_code == 429:
        raise OpenMeteoRateLimitError()
    if r.status_code >= 500:
        raise ClimaNoDisponibleError()
    r.raise_for_status()
    return r.json()


async def obtener_clima_diario(lat: float, lon: float) -> dict[str, list]:
    """Clima diario de 2016 a 2025 (una sola petición). Devuelve el bloque `daily` de Open-Meteo."""
    datos = await _get(URL_HISTORICO, {
        "latitude": lat, "longitude": lon,
        "start_date": PERIODO_INICIO, "end_date": PERIODO_FIN,
        "daily": "temperature_2m_mean,temperature_2m_min,temperature_2m_max,precipitation_sum",
        "timezone": "auto",
    })
    return datos.get("daily", {})


async def obtener_pronostico_7d(lat: float, lon: float) -> list[dict]:
    """Pronóstico de 7 días convertido en alertas. `[]` significa que de verdad no hay riesgo.

    Si Open-Meteo falla (429, timeout, red) o responde sin días, lanza ClimaNoDisponibleError:
    así /api/alertas responde 503 (el frontend muestra "Reintentar") y no se guarda nada en caché.
    Antes devolvía `[]` y la app decía "Sin alertas" aunque no hubiera pronóstico.
    """
    datos = await _get(URL_PRONOSTICO, {
        "latitude": lat, "longitude": lon, "forecast_days": 7, "timezone": "auto",
        "daily": "weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,"
                 "wind_gusts_10m_max,uv_index_max",
    })
    diario = datos.get("daily") or {}
    if not diario.get("time"):
        raise ClimaNoDisponibleError()
    return motor_alertas.construir_alertas(diario)
