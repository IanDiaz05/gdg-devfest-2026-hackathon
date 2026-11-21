"""Alertas de 7 días a partir del pronóstico diario de Open-Meteo.

Se genera como máximo una alerta por tipo (la del peor día), con un consejo para macetas.
Umbrales:
- helada: mínima <= 2 °C (alta si <= 0 °C)
- calor: máxima >= 35 °C (alta si >= 38 °C)
- lluvia_fuerte: >= 25 mm en el día (alta si >= 50 mm); escala de lluvias del SMN
- tormenta: código de tiempo WMO 95, 96 o 99 (el granizo no es confiable en México, se trata como tormenta)
- viento: rachas >= 50 km/h (alta si >= 70 km/h)
- uv: índice UV >= 11 (extremo)
"""
from datetime import date
from typing import Any

_DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

# Qué valor de `sensible_a` (cultivos_curados.json) afecta cada alerta
SENSIBILIDAD_POR_ALERTA: dict[str, set[str]] = {
    "helada": {"helada"},
    "calor": {"calor"},
    "lluvia_fuerte": {"lluvia_fuerte"},
    "tormenta": {"lluvia_fuerte", "viento"},
    "viento": {"viento"},
    "uv": set(),
}


def _dia(texto: str) -> str:
    try:
        return f"el {_DIAS[date.fromisoformat(texto).weekday()]}"
    except ValueError:
        return "esta semana"


def _num(v: Any) -> float | None:
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _fmt(v: float) -> str:
    return str(int(round(v))) if abs(v - round(v)) < 0.05 else f"{v:.1f}"


def construir_alertas(diario: dict[str, list]) -> list[dict[str, Any]]:
    fechas = diario.get("time") or []

    def serie(clave: str) -> list[float | None]:
        valores = diario.get(clave) or []
        return [_num(valores[i]) if i < len(valores) else None for i in range(len(fechas))]

    tmin, tmax, lluvia = serie("temperature_2m_min"), serie("temperature_2m_max"), serie("precipitation_sum")
    rachas, uv, codigos = serie("wind_gusts_10m_max"), serie("uv_index_max"), serie("weather_code")

    def peor(valores: list[float | None], mayor: bool) -> tuple[int, float] | None:
        pares = [(i, v) for i, v in enumerate(valores) if v is not None]
        if not pares:
            return None
        return max(pares, key=lambda p: p[1]) if mayor else min(pares, key=lambda p: p[1])

    alertas: list[dict[str, Any]] = []

    def agregar(tipo: str, severidad: str, i: int, titulo: str, mensaje: str) -> None:
        alertas.append({"tipo": tipo, "severidad": severidad, "fecha": fechas[i],
                        "titulo": titulo, "mensaje": mensaje})

    if (p := peor(tmin, mayor=False)) and p[1] <= 2:
        i, v = p
        agregar("helada", "alta" if v <= 0 else "media", i, "Riesgo de helada esta semana",
                f"Se pronostican {_fmt(v)} °C {_dia(fechas[i])} por la madrugada. "
                "Mete tus macetas o cúbrelas con tela por la noche.")
    if (p := peor(tmax, mayor=True)) and p[1] >= 35:
        i, v = p
        agregar("calor", "alta" if v >= 38 else "media", i, "Calor extremo esta semana",
                f"Se esperan {_fmt(v)} °C {_dia(fechas[i])}. Riega temprano y da media sombra a las plantas de hoja.")
    if (p := peor(lluvia, mayor=True)) and p[1] >= 25:
        i, v = p
        agregar("lluvia_fuerte", "alta" if v >= 50 else "media", i, "Lluvia fuerte esta semana",
                f"Se esperan {_fmt(v)} mm de lluvia {_dia(fechas[i])}. Mueve bajo techo las macetas sensibles, "
                "vacía los platos y no riegues ese día.")
    tormentas = [i for i, c in enumerate(codigos) if c is not None and int(c) in (95, 96, 99)]
    if tormentas:
        i = tormentas[0]
        fuerte = lluvia[i] is not None and lluvia[i] >= 50
        agregar("tormenta", "alta" if fuerte else "media", i, "Tormenta eléctrica en el pronóstico",
                f"Hay pronóstico de tormenta {_dia(fechas[i])}. Asegura las macetas altas, amarra los tutores "
                "y cosecha los frutos maduros antes.")
    if (p := peor(rachas, mayor=True)) and p[1] >= 50:
        i, v = p
        agregar("viento", "alta" if v >= 70 else "media", i, "Viento fuerte esta semana",
                f"Rachas de hasta {_fmt(v)} km/h {_dia(fechas[i])}. Pega las macetas altas a una pared y amarra los tutores.")
    if (p := peor(uv, mayor=True)) and p[1] >= 11:
        i, v = p
        agregar("uv", "media", i, "Radiación UV extrema",
                f"Índice UV de {_fmt(v)} {_dia(fechas[i])}. Protege del sol de mediodía las plántulas recién trasplantadas.")
    return alertas


def cultivos_afectados(tipo: str, cultivos_db: list[dict[str, Any]]) -> list[str]:
    """Ids de los cultivos a los que les afecta una alerta, según `sensible_a` y `tolera_helada`."""
    claves = SENSIBILIDAD_POR_ALERTA.get(tipo, set())
    afectados = []
    for fila in cultivos_db:
        datos = fila.get("datos_json") if isinstance(fila.get("datos_json"), dict) else {}
        reglas = fila.get("reglas_json") if isinstance(fila.get("reglas_json"), dict) else {}
        ficha = datos.get("ficha_tecnica") if isinstance(datos.get("ficha_tecnica"), dict) else {}
        sensibles = set(reglas.get("sensible_a") or [])
        no_tolera_helada = tipo == "helada" and ficha.get("tolera_helada") is False
        if sensibles & claves or no_tolera_helada:
            afectados.append(str(fila.get("id")))
    return afectados
