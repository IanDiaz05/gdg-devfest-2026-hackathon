from typing import Any

_LUCES = {"pleno_sol", "media_sombra", "sombra"}
_DIFICULTADES = {"facil", "media", "dificil"}
_SEMAFORO = {"optimo": "verde", "con_cuidados": "amarillo", "no_ahora": "rojo"}
_RANGO_ESTADO = {"optimo": 0, "con_cuidados": 1, "no_ahora": 2}

# Muestra del contrato para Toluca en diciembre, sin iconos, mientras cultivos.json llega vacio.
_MUESTRA_VACIA: list[dict[str, Any]] = [
    {
        "id": "lechuga",
        "nombre": "Lechuga",
        "icono": "",
        "categoria": "Hortalizas",
        "estado": "con_cuidados",
        "semaforo": "amarillo",
        "razon_corta": "Diciembre es algo frio (11 °C; lo ideal es 12-21 °C). Tolera heladas ligeras: cubrela en las noches mas frias.",
        "etiqueta_clima": "Algo frio",
        "meses_ideales": [],
        "meses_posibles": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        "filtros_rapidos": {
            "maceta_min_litros": 5,
            "espacio_tipo": "maceta_chica",
            "luz": "media_sombra",
            "dias_cosecha_aprox": 55,
            "dificultad": "facil",
        },
        "finanzas_sniim": {
            "mercado_referencia": "Central de Abasto CDMX",
            "producto_sniim": "Lechuga Romanita grande",
            "mes_cosecha_estimado": 2,
            "variacion_precio_pct": -12,
            "destacar_ahorro": False,
            "mensaje_ahorro": None,
        },
    },
    {
        "id": "jitomate",
        "nombre": "Jitomate",
        "icono": "",
        "categoria": "Hortalizas",
        "estado": "no_ahora",
        "semaforo": "rojo",
        "razon_corta": "En diciembre hay heladas en 57% de los anos y no las aguanta. Mejor siembralo entre marzo y julio.",
        "etiqueta_clima": "Riesgo alto de helada",
        "meses_ideales": [],
        "meses_posibles": [3, 4, 5, 6, 7],
        "filtros_rapidos": {
            "maceta_min_litros": 20,
            "espacio_tipo": "maceta_grande",
            "luz": "pleno_sol",
            "dias_cosecha_aprox": 90,
            "dificultad": "media",
        },
        "finanzas_sniim": {
            "mercado_referencia": "Central de Abasto CDMX",
            "producto_sniim": "Tomate Saladette",
            "mes_cosecha_estimado": 10,
            "variacion_precio_pct": 9,
            "destacar_ahorro": False,
            "mensaje_ahorro": None,
        },
    },
    {
        "id": "albahaca",
        "nombre": "Albahaca",
        "icono": "",
        "categoria": "Hierbas",
        "estado": "no_ahora",
        "semaforo": "rojo",
        "razon_corta": "En diciembre hay heladas en 57% de los anos y no las aguanta. Mejor siembrala entre marzo y julio.",
        "etiqueta_clima": "Riesgo alto de helada",
        "meses_ideales": [],
        "meses_posibles": [3, 4, 5, 6, 7],
        "filtros_rapidos": {
            "maceta_min_litros": 3,
            "espacio_tipo": "maceta_chica",
            "luz": "pleno_sol",
            "dias_cosecha_aprox": 60,
            "dificultad": "facil",
        },
        "finanzas_sniim": None,
    },
]


def _copia_muestra() -> list[dict[str, Any]]:
    copia: list[dict[str, Any]] = []
    for item in _MUESTRA_VACIA:
        fila = dict(item)
        fila["meses_ideales"] = list(item["meses_ideales"])
        fila["meses_posibles"] = list(item["meses_posibles"])
        fila["filtros_rapidos"] = dict(item["filtros_rapidos"])
        if item["finanzas_sniim"] is not None:
            fila["finanzas_sniim"] = dict(item["finanzas_sniim"])
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


def _dias_cosecha(datos: dict[str, Any], reglas: dict[str, Any]) -> int:
    for origen in (datos, datos.get("ficha_tecnica") if isinstance(datos.get("ficha_tecnica"), dict) else {}):
        if isinstance(origen, dict) and isinstance(origen.get("dias_cosecha_aprox"), (int, float)):
            return max(1, _entero(origen["dias_cosecha_aprox"], 60))
    rango = reglas.get("dias_a_cosecha")
    if not isinstance(rango, (list, tuple)) or not rango:
        ficha = datos.get("ficha_tecnica")
        rango = ficha.get("dias_a_cosecha") if isinstance(ficha, dict) else None
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


def _fmt_temp(valor: float) -> str:
    redondeado = round(valor, 1)
    if redondeado == int(redondeado):
        return str(int(redondeado))
    return f"{redondeado:.1f}"


def _meses_de_ciclo(dias: int, perenne: bool) -> int:
    if perenne:
        return 12
    return min(6, max(1, int(round(dias / 30))))


def _serie_variacion(sniim: dict[str, Any], mes: int) -> int | None:
    for clave in ("variacion_mensual", "variacion_pct_mensual", "perfil_mensual"):
        serie = sniim.get(clave)
        if isinstance(serie, dict):
            crudo = serie.get(str(mes), serie.get(mes))
            if isinstance(crudo, dict):
                crudo = crudo.get("variacion_pct")
            if isinstance(crudo, (int, float)) and not isinstance(crudo, bool):
                return int(round(crudo))
        if isinstance(serie, list):
            if len(serie) == 12 and isinstance(serie[mes - 1], (int, float)):
                return int(round(serie[mes - 1]))
            for item in serie:
                if isinstance(item, dict) and item.get("mes") == mes:
                    crudo = item.get("variacion_pct", item.get("variacion_precio_pct"))
                    if isinstance(crudo, (int, float)) and not isinstance(crudo, bool):
                        return int(round(crudo))
    for clave in ("mes_mas_caro", "mes_mas_barato"):
        bloque = sniim.get(clave)
        if isinstance(bloque, dict) and bloque.get("mes") == mes:
            crudo = bloque.get("variacion_pct")
            if isinstance(crudo, (int, float)) and not isinstance(crudo, bool):
                return int(round(crudo))
    return None


def _finanzas(
    datos: dict[str, Any],
    sniim: Any,
    nombre: str,
    dias: int,
    mes_evaluado: int,
) -> dict[str, Any] | None:
    if not isinstance(sniim, dict):
        return None
    perfil = sniim.get("contexto_economico_sniim") if "contexto_economico_sniim" in sniim else sniim
    if not isinstance(perfil, dict):
        return None
    desplazamiento = int(round(dias / 30))
    mes_cosecha = ((mes_evaluado - 1 + desplazamiento) % 12) + 1
    variacion = _serie_variacion(perfil, mes_cosecha)
    if variacion is None:
        variacion = _serie_variacion(sniim, mes_cosecha)
    if variacion is None and isinstance(perfil.get("variacion_precio_pct"), (int, float)):
        variacion = int(round(perfil["variacion_precio_pct"]))
    if variacion is None:
        variacion = 0
    destacar = variacion >= 15
    producto = perfil.get("producto_sniim") or datos.get("producto_sniim") or nombre
    mercado = perfil.get("mercado_referencia") or "Central de Abasto CDMX"
    mensaje = None
    if destacar:
        mensaje = (
            f"En la cosecha el precio suele estar {variacion}% por arriba del promedio. "
            "Conviene producirlo en casa."
        )
    return {
        "mercado_referencia": str(mercado),
        "producto_sniim": str(producto),
        "mes_cosecha_estimado": mes_cosecha,
        "variacion_precio_pct": variacion,
        "destacar_ahorro": destacar,
        "mensaje_ahorro": mensaje,
    }


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
            f"En {mes_txt} hay heladas en {helada}% de los anos y no las aguanta.",
            0,
        )
    if not tolera_helada and helada >= 5:
        return (
            "con_cuidados",
            "Heladas ligeras",
            f"{nombre} tiene heladas en {helada}% de los anos. Protege el cultivo en las noches frias.",
            0,
        )
    # Sin % de noches <= -2 °C: una minima media bajo cero se toma como helada fuerte.
    if tolera_helada and minima <= -2:
        return (
            "con_cuidados",
            "Heladas fuertes",
            f"{nombre} puede tener heladas fuertes. Cubre el cultivo en las noches mas frias.",
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
            "Algo frio",
            f"{nombre} es algo frio ({media_txt} °C; lo ideal es {_fmt_temp(ideal[0])}-{_fmt_temp(ideal[1])} °C).",
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
        f"{nombre} esta dentro del clima ideal para sembrarlo.",
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
    ficha = datos.get("ficha_tecnica") if isinstance(datos.get("ficha_tecnica"), dict) else {}

    limite = _par(reglas.get("temp_limite_c") or ficha.get("temp_limite_c"), (0.0, 50.0))
    ideal = _par(reglas.get("temp_ideal_c") or ficha.get("temp_ideal_c"), limite)
    tolera = bool(reglas.get("tolera_helada") if "tolera_helada" in reglas else ficha.get("tolera_helada"))
    perenne = bool(reglas.get("perenne") if "perenne" in reglas else datos.get("perenne"))
    dias = _dias_cosecha(datos, reglas)
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
    maceta = _entero(
        reglas.get("maceta_min_litros", ficha.get("maceta_min_litros", datos.get("maceta_min_litros"))),
        5,
    )
    luz = str(reglas.get("luz") or ficha.get("luz") or datos.get("luz") or "pleno_sol")
    if luz not in _LUCES:
        luz = "pleno_sol"
    dificultad = str(datos.get("dificultad") or "media")
    if dificultad not in _DIFICULTADES:
        dificultad = "media"
    nombre = str(datos.get("nombre") or cultivo.get("nombre") or "")
    return {
        "id": str(datos.get("id") or cultivo.get("id") or ""),
        "nombre": nombre,
        "icono": str(datos.get("icono") if datos.get("icono") is not None else cultivo.get("icono") or ""),
        "categoria": str(datos.get("categoria") or cultivo.get("categoria") or ""),
        "estado": estado,
        "semaforo": _SEMAFORO[estado],
        "razon_corta": razon,
        "etiqueta_clima": etiqueta,
        "meses_ideales": meses_ideales,
        "meses_posibles": meses_posibles,
        "filtros_rapidos": {
            "maceta_min_litros": maceta,
            "espacio_tipo": _espacio(maceta),
            "luz": luz,
            "dias_cosecha_aprox": dias,
            "dificultad": dificultad,
        },
        "finanzas_sniim": _finanzas(datos, cultivo.get("sniim_json"), nombre, dias, mes_evaluado),
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
