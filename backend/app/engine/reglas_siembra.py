from typing import Any

_DIFICULTADES = {"facil", "media", "dificil"}
_CONSUMOS = {"bajo", "medio", "alto"}
_LUZ_TEXTO_A_NIVEL = {"sombra": 1, "luz_indirecta": 2, "media_sombra": 3, "pleno_sol": 4}
_SEMAFORO = {"optimo": "verde", "con_cuidados": "amarillo", "no_ahora": "rojo"}
_RANGO_ESTADO = {"optimo": 0, "con_cuidados": 1, "no_ahora": 2}

# Muestra del contrato para Toluca en diciembre, mientras cultivos.json llega vacío.
_MUESTRA_VACIA: list[dict[str, Any]] = [
    {
        "id": "lechuga",
        "nombre": "Lechuga",
        "icono": "🥬",
        "categoria": "Hortalizas de hoja",
        "estado": "con_cuidados",
        "semaforo": "amarillo",
        "razon_corta": "Diciembre es algo frío (11 °C; lo ideal es 12-21 °C). Tolera heladas ligeras: cúbrela en las noches más frías.",
        "etiqueta_clima": "Algo frío",
        "meses_ideales": [],
        "meses_posibles": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        "filtros_rapidos": {
            "maceta_min_litros": 5,
            "espacio_tipo": "maceta_chica",
            "profundidad_maceta_cm": 15,
            "luz_nivel": 3,
            "riego_frecuencia_dias": 2,
            "consumo_hidrico": "alto",
            "pet_safe": True,
            "atrae_polinizadores": False,
            "es_nativa_region": False,
            "dias_cosecha_aprox": 55,
            "dificultad": "facil",
        },
    },
    {
        "id": "jitomate",
        "nombre": "Jitomate",
        "icono": "🍅",
        "categoria": "Frutos",
        "estado": "no_ahora",
        "semaforo": "rojo",
        "razon_corta": "En diciembre hay heladas en 57% de los años y no las aguanta.",
        "etiqueta_clima": "Riesgo alto de helada",
        "meses_ideales": [],
        "meses_posibles": [3, 4, 5, 6, 7],
        "filtros_rapidos": {
            "maceta_min_litros": 20,
            "espacio_tipo": "maceta_grande",
            "profundidad_maceta_cm": 30,
            "luz_nivel": 4,
            "riego_frecuencia_dias": 2,
            "consumo_hidrico": "alto",
            "pet_safe": False,
            "atrae_polinizadores": True,
            "es_nativa_region": True,
            "dias_cosecha_aprox": 90,
            "dificultad": "media",
        },
    },
]


def _copia_muestra() -> list[dict[str, Any]]:
    copia: list[dict[str, Any]] = []
    for item in _MUESTRA_VACIA:
        fila = dict(item)
        fila["meses_ideales"] = list(item["meses_ideales"])
        fila["meses_posibles"] = list(item["meses_posibles"])
        fila["filtros_rapidos"] = dict(item["filtros_rapidos"])
        copia.append(fila)
    return copia


def _numero(valor: Any, default: float) -> float:
    if isinstance(valor, bool) or not isinstance(valor, (int, float)):
        return default
    return float(valor)


def _par(valor: Any, default: tuple[float, float]) -> tuple[float, float]:
    if isinstance(valor, (list, tuple)) and len(valor) >= 2:
        return _numero(valor[0], default[0]), _numero(valor[1], default[1])
    return default


def _entero(valor: Any, default: int) -> int:
    if isinstance(valor, bool) or not isinstance(valor, (int, float)):
        return default
    return int(round(valor))


def _primero(*valores: Any) -> Any:
    """Primer valor que no sea None (sirve para buscar un campo en varios bloques del JSON)."""
    for valor in valores:
        if valor is not None:
            return valor
    return None


def _bloque(datos: dict[str, Any], clave: str) -> dict[str, Any]:
    valor = datos.get(clave)
    return valor if isinstance(valor, dict) else {}


def _dias_cosecha(datos: dict[str, Any], reglas: dict[str, Any]) -> int:
    ficha = _bloque(datos, "ficha_tecnica")
    directo = _primero(reglas.get("dias_cosecha_aprox"), datos.get("dias_cosecha_aprox"), ficha.get("dias_cosecha_aprox"))
    if isinstance(directo, (int, float)) and not isinstance(directo, bool):
        return max(1, _entero(directo, 60))
    rango = reglas.get("dias_a_cosecha") or ficha.get("dias_a_cosecha")
    if isinstance(rango, (list, tuple)) and rango:
        numeros = [_numero(item, 0) for item in rango if isinstance(item, (int, float))]
        if numeros:
            return max(1, int(round(sum(numeros) / len(numeros))))
    return 60


def _espacio(litros: int) -> str:
    if litros <= 8:
        return "maceta_chica"
    if litros <= 25:
        return "maceta_grande"
    return "patio"


def atributos_cultivo(datos: dict[str, Any], reglas: dict[str, Any]) -> dict[str, Any]:
    """Campos de maceta, cuidado e impacto ambiental de un cultivo (contrato v3).

    Los busca en los bloques del contrato 2 (ficha_tecnica, restricciones, impacto_ambiental,
    guia_rapida) y, si no están, en el nivel superior o en `reglas`, con valores por defecto seguros.
    """
    ficha = _bloque(datos, "ficha_tecnica")
    restricciones = _bloque(datos, "restricciones")
    impacto = _bloque(datos, "impacto_ambiental")
    guia = _bloque(datos, "guia_rapida")

    luz = _primero(ficha.get("luz_nivel"), datos.get("luz_nivel"), ficha.get("luz"))
    if isinstance(luz, str):
        luz = _LUZ_TEXTO_A_NIVEL.get(luz, 4)
    luz_nivel = min(4, max(1, _entero(luz, 4)))

    consumo = str(_primero(impacto.get("consumo_hidrico"), datos.get("consumo_hidrico")) or "medio")
    dificultad = str(_primero(restricciones.get("dificultad"), reglas.get("dificultad"), datos.get("dificultad")) or "media")
    maceta = _entero(_primero(ficha.get("maceta_min_litros"), reglas.get("maceta_min_litros"), datos.get("maceta_min_litros")), 5)

    return {
        "maceta_min_litros": maceta,
        "espacio_tipo": _espacio(maceta),
        "profundidad_maceta_cm": _entero(
            _primero(ficha.get("profundidad_maceta_cm"), datos.get("profundidad_maceta_cm"), ficha.get("profundidad_min_cm")), 20
        ),
        "luz_nivel": luz_nivel,
        "riego_frecuencia_dias": max(1, _entero(_primero(ficha.get("riego_frecuencia_dias"), datos.get("riego_frecuencia_dias")), 3)),
        "consumo_hidrico": consumo if consumo in _CONSUMOS else "medio",
        "pet_safe": bool(_primero(restricciones.get("pet_safe"), datos.get("pet_safe"), False)),
        "atrae_polinizadores": bool(_primero(impacto.get("atrae_polinizadores"), datos.get("atrae_polinizadores"), False)),
        "es_nativa_region": bool(_primero(datos.get("es_nativa_region"), False)),
        "dias_cosecha_aprox": _dias_cosecha(datos, reglas),
        "dificultad": dificultad if dificultad in _DIFICULTADES else "media",
        "error_comun": str(_primero(guia.get("error_comun"), datos.get("error_comun")) or ""),
    }


_MESES_TXT = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
              "septiembre", "octubre", "noviembre", "diciembre"]


def _cuando_si(meses: list[int], datos: dict[str, Any]) -> str:
    """'Mejor siémbralo entre marzo y julio.' a partir de los meses buenos (considera dic-ene seguidos)."""
    if not meses:
        return "En tu zona el clima no le acomoda en ningún mes."
    if len(meses) == 12:
        return ""
    conjunto = set(meses)
    # inicio de cada tramo: mes bueno cuyo mes anterior no es bueno (circular)
    inicios = [m for m in sorted(conjunto) if ((m - 2) % 12) + 1 not in conjunto]
    tramos = []
    for ini in inicios:
        fin = ini
        while (fin % 12) + 1 in conjunto and (fin % 12) + 1 != ini:
            fin = (fin % 12) + 1
        tramos.append((ini, fin))
    primera_palabra = (str(datos.get("nombre", "")).split() or [""])[0].lower()
    pron = "la" if primera_palabra.endswith("a") else "lo"
    if len(tramos) == 1:
        ini, fin = tramos[0]
        if ini == fin:
            return f"Mejor siémbra{pron} en {_MESES_TXT[ini - 1]}."
        return f"Mejor siémbra{pron} entre {_MESES_TXT[ini - 1]} y {_MESES_TXT[fin - 1]}."
    textos = [_MESES_TXT[i - 1] if i == f else f"{_MESES_TXT[i - 1]} a {_MESES_TXT[f - 1]}" for i, f in tramos]
    return f"Mejor siémbra{pron} en {', '.join(textos[:-1])} o {textos[-1]}."


def _fmt_temp(valor: float) -> str:
    redondeado = round(valor, 1)
    if redondeado == int(redondeado):
        return str(int(redondeado))
    return f"{redondeado:.1f}"


def _meses_de_ciclo(dias: int, perenne: bool) -> int:
    if perenne:
        return 12
    return min(6, max(1, int(round(dias / 30))))


def _clasificar_mes(
    mes_info: dict[str, Any],
    tolera_helada: bool,
    limite: tuple[float, float],
    ideal: tuple[float, float],
) -> tuple[str, str, str, int]:
    nombre = str(mes_info.get("nombre") or "")
    mes_txt = nombre.lower()
    media = _numero(mes_info.get("temp_media_c"), 0)
    minima = _numero(mes_info.get("temp_min_promedio_c"), media)
    helada = _entero(mes_info.get("anios_con_helada_pct"), 0)
    media_txt = _fmt_temp(media)

    if not tolera_helada and helada >= 20:
        return (
            "no_ahora",
            "Riesgo alto de helada",
            f"En {mes_txt} hay heladas en {helada}% de los años y no las aguanta.",
            0,
        )
    if not tolera_helada and helada >= 5:
        return (
            "con_cuidados",
            "Heladas ligeras",
            f"{nombre} tiene heladas en {helada}% de los años. Protege el cultivo en las noches frías.",
            0,
        )
    # Los que toleran heladas ligeras solo sufren con heladas fuertes (<= -2 °C)
    helada_fuerte = mes_info.get("anios_con_helada_fuerte_pct")
    if tolera_helada and isinstance(helada_fuerte, (int, float)):
        if helada_fuerte >= 20:
            return (
                "no_ahora",
                "Heladas fuertes",
                f"En {mes_txt} hay heladas fuertes (-2 °C o menos) en {int(helada_fuerte)}% de los años.",
                0,
            )
        if helada_fuerte >= 5:
            return (
                "con_cuidados",
                "Heladas fuertes ocasionales",
                f"{nombre} tiene heladas fuertes en {int(helada_fuerte)}% de los años. Cubre el cultivo en las noches más frías.",
                0,
            )
    elif tolera_helada and minima <= -2:
        # Caché vieja sin el % de heladas fuertes: una mínima media bajo cero se toma como helada fuerte
        return (
            "con_cuidados",
            "Heladas fuertes",
            f"{nombre} puede tener heladas fuertes. Cubre el cultivo en las noches más frías.",
            0,
        )

    if media < limite[0]:
        return (
            "no_ahora",
            "Fuera de temperatura",
            f"En {mes_txt} la media es {media_txt} °C y necesita al menos {_fmt_temp(limite[0])} °C.",
            1,
        )
    if media > limite[1]:
        return (
            "no_ahora",
            "Fuera de temperatura",
            f"En {mes_txt} la media es {media_txt} °C y no conviene pasar de {_fmt_temp(limite[1])} °C.",
            1,
        )
    if media < ideal[0]:
        return (
            "con_cuidados",
            "Algo frío",
            f"{nombre} es algo frío ({media_txt} °C; lo ideal es {_fmt_temp(ideal[0])}-{_fmt_temp(ideal[1])} °C).",
            1,
        )
    if media > ideal[1]:
        return (
            "con_cuidados",
            "Algo caluroso",
            f"{nombre} es algo caluroso ({media_txt} °C; lo ideal es {_fmt_temp(ideal[0])}-{_fmt_temp(ideal[1])} °C).",
            1,
        )
    return (
        "optimo",
        "Clima ideal",
        f"{nombre} está dentro del clima ideal para sembrarlo.",
        2,
    )


def _peor(
    actual: tuple[str, str, str, int] | None,
    nuevo: tuple[str, str, str, int],
) -> tuple[str, str, str, int]:
    if actual is None:
        return nuevo
    if _RANGO_ESTADO[nuevo[0]] > _RANGO_ESTADO[actual[0]]:
        return nuevo
    if _RANGO_ESTADO[nuevo[0]] == _RANGO_ESTADO[actual[0]] and nuevo[3] < actual[3]:
        return nuevo
    return actual


def _evaluar_uno(
    cultivo: dict[str, Any],
    por_mes: dict[int, dict[str, Any]],
    altitud_m: int,
    mes_evaluado: int,
) -> dict[str, Any]:
    datos = cultivo.get("datos_json") if isinstance(cultivo.get("datos_json"), dict) else {}
    reglas = cultivo.get("reglas_json") if isinstance(cultivo.get("reglas_json"), dict) else {}
    ficha = _bloque(datos, "ficha_tecnica")
    atributos = atributos_cultivo(datos, reglas)

    limite = _par(reglas.get("temp_limite_c") or ficha.get("temp_limite_c"), (0.0, 50.0))
    ideal = _par(reglas.get("temp_ideal_c") or ficha.get("temp_ideal_c"), limite)
    tolera = bool(reglas.get("tolera_helada") if "tolera_helada" in reglas else ficha.get("tolera_helada"))
    perenne = bool(reglas.get("perenne") if "perenne" in reglas else datos.get("perenne"))
    dias = atributos["dias_cosecha_aprox"]
    ventana = _meses_de_ciclo(dias, perenne)
    altitud_max = reglas.get("altitud_max_m", ficha.get("altitud_max_m"))
    altitud_max_m = _entero(altitud_max, 10000) if altitud_max is not None else None

    estados: dict[int, tuple[str, str, str, int]] = {}
    for mes in range(1, 13):
        acumulado: tuple[str, str, str, int] | None = None
        for offset in range(ventana):
            mes_ciclo = ((mes - 1 + offset) % 12) + 1
            info = por_mes.get(mes_ciclo) or por_mes.get(mes) or {}
            acumulado = _peor(acumulado, _clasificar_mes(info, tolera, limite, ideal))
        assert acumulado is not None
        estado, etiqueta, razon, prioridad = acumulado
        if estado == "optimo" and altitud_max_m is not None and altitud_m > altitud_max_m:
            estado = "con_cuidados"
            etiqueta = "Altitud alta"
            razon = (
                f"La altitud de la zona ({altitud_m} m) supera lo recomendado ({altitud_max_m} m)."
            )
            prioridad = 2
        estados[mes] = (estado, etiqueta, razon, prioridad)

    estado, etiqueta, razon, _prioridad = estados[mes_evaluado]
    meses_ideales = [mes for mes, resultado in estados.items() if resultado[0] == "optimo"]
    meses_posibles = [
        mes for mes, resultado in estados.items() if resultado[0] in {"optimo", "con_cuidados"}
    ]
    if estado == "no_ahora":
        razon = f"{razon} {_cuando_si(meses_ideales or meses_posibles, datos)}".strip()
    filtros = {k: v for k, v in atributos.items() if k != "error_comun"}
    return {
        "id": str(datos.get("id") or cultivo.get("id") or ""),
        "nombre": str(datos.get("nombre") or cultivo.get("nombre") or ""),
        "icono": str(datos.get("icono") if datos.get("icono") is not None else cultivo.get("icono") or ""),
        "categoria": str(datos.get("categoria") or cultivo.get("categoria") or ""),
        "estado": estado,
        "semaforo": _SEMAFORO[estado],
        "razon_corta": razon,
        "etiqueta_clima": etiqueta,
        "meses_ideales": meses_ideales,
        "meses_posibles": meses_posibles,
        "filtros_rapidos": filtros,
    }


def evaluar_cultivos(
    cultivos_db: list[dict],
    resumen_mensual: list[dict],
    altitud_m: int,
    mes_evaluado: int,
) -> list[dict]:
    if not cultivos_db:
        return _copia_muestra()
    por_mes = {int(item["mes"]): item for item in resumen_mensual}
    return [
        _evaluar_uno(cultivo, por_mes, altitud_m, mes_evaluado)
        for cultivo in cultivos_db
    ]
