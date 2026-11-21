from app.api.errors import CiudadNoEncontradaError

_TOLUCA_LAT = 19.288
_TOLUCA_LON = -99.653
_TOLUCA_ALTITUD_M = 2671

_ALTERNATIVAS_TOLUCA = [
    {
        "nombre": "Toluca",
        "estado": "Estado de Chiapas",
        "lat": 15.029,
        "lon": -92.245,
    },
    {
        "nombre": "Toluca",
        "estado": "Estado de Puebla",
        "lat": 18.893,
        "lon": -97.250,
    },
]


def _ubicacion(lat: float, lon: float, alternativas: list[dict]) -> dict:
    return {
        "nombre": "Toluca de Lerdo",
        "municipio": "Toluca de Lerdo",
        "estado": "Estado de Mexico",
        "lat": lat,
        "lon": lon,
        "altitud_m": _TOLUCA_ALTITUD_M,
        "alternativas": alternativas,
    }


async def buscar_ubicacion(q: str) -> dict:
    if q is None or not str(q).strip():
        raise CiudadNoEncontradaError()
    return _ubicacion(_TOLUCA_LAT, _TOLUCA_LON, [dict(item) for item in _ALTERNATIVAS_TOLUCA])


async def resolver_coordenadas(lat: float, lon: float) -> dict:
    return _ubicacion(lat, lon, [])


async def obtener_diario_30_anios(lat: float, lon: float) -> list[dict]:
    return []


async def obtener_pronostico_7d(lat: float, lon: float) -> list[dict]:
    return []
