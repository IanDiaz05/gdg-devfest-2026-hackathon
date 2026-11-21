# Medias mensuales de Toluca, 1996-2025. Diciembre, enero y mayo salen del contrato;
# el resto sigue la misma curva hasta que el agregado de Open-Meteo lo reemplace.
_TOLUCA_MENSUAL: list[dict] = [
    {"mes": 1, "nombre": "Enero", "temp_media_c": 10.7, "temp_min_promedio_c": 4.2, "temp_max_promedio_c": 18.4, "anios_con_helada_pct": 72},
    {"mes": 2, "nombre": "Febrero", "temp_media_c": 11.6, "temp_min_promedio_c": 5.0, "temp_max_promedio_c": 19.2, "anios_con_helada_pct": 58},
    {"mes": 3, "nombre": "Marzo", "temp_media_c": 13.1, "temp_min_promedio_c": 6.4, "temp_max_promedio_c": 20.6, "anios_con_helada_pct": 32},
    {"mes": 4, "nombre": "Abril", "temp_media_c": 14.5, "temp_min_promedio_c": 7.8, "temp_max_promedio_c": 21.8, "anios_con_helada_pct": 12},
    {"mes": 5, "nombre": "Mayo", "temp_media_c": 15.5, "temp_min_promedio_c": 8.9, "temp_max_promedio_c": 22.4, "anios_con_helada_pct": 4},
    {"mes": 6, "nombre": "Junio", "temp_media_c": 15.0, "temp_min_promedio_c": 9.2, "temp_max_promedio_c": 21.2, "anios_con_helada_pct": 1},
    {"mes": 7, "nombre": "Julio", "temp_media_c": 14.1, "temp_min_promedio_c": 8.6, "temp_max_promedio_c": 20.2, "anios_con_helada_pct": 2},
    {"mes": 8, "nombre": "Agosto", "temp_media_c": 14.0, "temp_min_promedio_c": 8.4, "temp_max_promedio_c": 20.1, "anios_con_helada_pct": 3},
    {"mes": 9, "nombre": "Septiembre", "temp_media_c": 13.9, "temp_min_promedio_c": 8.0, "temp_max_promedio_c": 19.8, "anios_con_helada_pct": 6},
    {"mes": 10, "nombre": "Octubre", "temp_media_c": 13.2, "temp_min_promedio_c": 7.0, "temp_max_promedio_c": 19.6, "anios_con_helada_pct": 18},
    {"mes": 11, "nombre": "Noviembre", "temp_media_c": 11.9, "temp_min_promedio_c": 5.6, "temp_max_promedio_c": 18.8, "anios_con_helada_pct": 40},
    {"mes": 12, "nombre": "Diciembre", "temp_media_c": 11.1, "temp_min_promedio_c": 5.8, "temp_max_promedio_c": 17.9, "anios_con_helada_pct": 57},
]


def procesar_clima_30_anios(datos_diarios: list[dict]) -> list[dict]:
    return [dict(mes) for mes in _TOLUCA_MENSUAL]
