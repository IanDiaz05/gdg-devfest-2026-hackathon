import unicodedata

from app.core.database import get_sequia_by_clave

_SUFIJO_MUNICIPIO = " de lerdo"

_NOMBRES = {
    "D0": "Anormalmente seco",
    "D1": "Sequia moderada",
    "D2": "Sequia severa",
    "D3": "Sequia extrema",
    "D4": "Sequia excepcional",
}

_CONSEJOS = {
    "D0": "Aun no es sequia, pero conviene cuidar el agua y cubrir la tierra para que no se seque.",
    "D1": "Usa acolchado (hojas secas) en tus macetas para que no se evapore el agua.",
    "D2": "La sequia es severa. Riega temprano, reutiliza agua y evita cultivos que beban mucho.",
    "D3": "Sequia extrema. Quedate con pocas plantas, usa acolchado grueso y riega solo lo necesario.",
    "D4": "Sequia excepcional. No abras siembras nuevas y reserva el agua para lo que ya esta creciendo.",
}


def _sin_acentos(texto: str) -> str:
    descompuesto = unicodedata.normalize("NFD", texto or "")
    return "".join(c for c in descompuesto if unicodedata.category(c) != "Mn")


def _limpiar(texto: str) -> str:
    return " ".join(_sin_acentos(texto).lower().split())


def normalizar_clave_municipio(estado: str, municipio: str) -> str:
    estado_limpio = _limpiar(estado)
    municipio_limpio = _limpiar(municipio)
    if municipio_limpio.endswith(_SUFIJO_MUNICIPIO):
        municipio_limpio = municipio_limpio[: -len(_SUFIJO_MUNICIPIO)].strip()
    return f"{estado_limpio}|{municipio_limpio}"


async def obtener_sequia_zona(estado: str, municipio: str) -> dict | None:
    clave = normalizar_clave_municipio(estado, municipio)
    fila = await get_sequia_by_clave(clave)
    if fila is None:
        return None
    nivel = str(fila.get("nivel") or "")
    nivel_nombre = _sin_acentos(str(fila.get("nivel_nombre") or "")).strip()
    if not nivel_nombre:
        nivel_nombre = _NOMBRES.get(nivel, nivel)
    return {
        "activa": nivel in {"D1", "D2", "D3", "D4"},
        "nivel": nivel,
        "nivel_nombre": nivel_nombre,
        "fecha_dato": str(fila.get("fecha_dato") or ""),
        "consejo": _CONSEJOS.get(
            nivel,
            "Revisa el riego de tus macetas y cubre la tierra para guardar humedad.",
        ),
    }
