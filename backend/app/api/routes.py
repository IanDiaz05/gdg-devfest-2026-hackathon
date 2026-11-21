import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Query

from app.api.errors import ClimaNoDisponibleError, CultivoNoEncontradoError, UbicacionInvalidaError
from app.core import database
from app.core.config import settings
from app.engine import alertas as motor_alertas
from app.engine import clima_processor, lluvia_reciente, reglas_siembra
from app.schemas.cultivos import (
    CompaneroCultivo,
    CultivoDetalleResponse,
    FichaTecnica,
    GuiaRapida,
    ImpactoAmbiental,
    Restricciones,
)
from app.schemas.recomendaciones import (
    AlertasResponse,
    ClimaZona,
    ErrorResponse,
    MesTemperatura,
    RecomendacionesResponse,
    SugerenciaCiudad,
    UbicacionAlertas,
    UbicacionInfo,
)
from app.services import open_meteo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

_PERIODO_REFERENCIA = open_meteo.PERIODO_REFERENCIA
_EVIDENCIAS = {"comprobada", "popular"}


def _mes_extremo(resumen: list[dict[str, Any]], mas_frio: bool) -> MesTemperatura:
    elegido = min(resumen, key=lambda item: item["temp_media_c"]) if mas_frio else max(
        resumen, key=lambda item: item["temp_media_c"]
    )
    return MesTemperatura(
        mes=int(elegido["mes"]),
        nombre=str(elegido["nombre"]),
        temp_media_c=float(elegido["temp_media_c"]),
    )


def _clima_zona(
    resumen: list[dict[str, Any]],
    mes: int,
    periodo: str,
    lluvia: dict[str, Any] | None,
    origen: str,
    fuente: dict[str, Any] | None,
) -> ClimaZona:
    actual = next(item for item in resumen if int(item["mes"]) == mes)
    return ClimaZona(
        mes_evaluado=mes,
        mes_nombre=str(actual["nombre"]),
        periodo_referencia=periodo,
        origen=origen,
        estacion_smn=fuente if origen == "conagua" else None,
        temp_media_c=float(actual["temp_media_c"]),
        temp_min_promedio_c=float(actual["temp_min_promedio_c"]),
        temp_max_promedio_c=float(actual["temp_max_promedio_c"]),
        anios_con_helada_pct=int(actual["anios_con_helada_pct"]),
        lluvia_mes_mm=actual.get("lluvia_mm"),
        mes_mas_frio=_mes_extremo(resumen, mas_frio=True),
        mes_mas_caluroso=_mes_extremo(resumen, mas_frio=False),
        lluvia_reciente=lluvia,
    )


def _textos(valor: Any) -> list[str]:
    if not isinstance(valor, list):
        return []
    return [str(item) for item in valor if isinstance(item, str)]


def _entero(valor: Any, default: int) -> int:
    if isinstance(valor, bool) or not isinstance(valor, (int, float)):
        return default
    return int(round(valor))


def _par_numeros(valor: Any, default: list[float]) -> list[float]:
    if isinstance(valor, (list, tuple)) and len(valor) >= 2:
        try:
            return [float(valor[0]), float(valor[1])]
        except (TypeError, ValueError):
            return default
    return default


def _par_enteros(valor: Any, default: list[int]) -> list[int]:
    numeros = _par_numeros(valor, [float(default[0]), float(default[1])])
    return [int(round(numeros[0])), int(round(numeros[1]))]


def _ficha_tecnica(datos: dict[str, Any], reglas: Any, atributos: dict[str, Any]) -> FichaTecnica:
    ficha = datos.get("ficha_tecnica") if isinstance(datos.get("ficha_tecnica"), dict) else {}
    reglas_dict = reglas if isinstance(reglas, dict) else {}
    return FichaTecnica(
        temp_ideal_c=_par_numeros(
            ficha.get("temp_ideal_c", reglas_dict.get("temp_ideal_c")),
            [0.0, 0.0],
        ),
        temp_limite_c=_par_numeros(
            ficha.get("temp_limite_c", reglas_dict.get("temp_limite_c")),
            [0.0, 0.0],
        ),
        tolera_helada=bool(ficha.get("tolera_helada", reglas_dict.get("tolera_helada", False))),
        altitud_max_m=_entero(ficha.get("altitud_max_m", reglas_dict.get("altitud_max_m")), 0),
        dias_a_cosecha=_par_enteros(
            ficha.get("dias_a_cosecha", reglas_dict.get("dias_a_cosecha")),
            [0, 0],
        ),
        maceta_min_litros=_entero(
            ficha.get("maceta_min_litros", reglas_dict.get("maceta_min_litros")),
            0,
        ),
        profundidad_maceta_cm=atributos["profundidad_maceta_cm"],
        luz_nivel=atributos["luz_nivel"],
        riego_frecuencia_dias=atributos["riego_frecuencia_dias"],
        riego=str(ficha.get("riego") or ""),
        sustrato_recomendado=str(ficha.get("sustrato_recomendado") or ""),
    )


def _companeros(valor: Any) -> list[CompaneroCultivo]:
    if not isinstance(valor, list):
        return []
    companeros: list[CompaneroCultivo] = []
    for item in valor:
        if not isinstance(item, dict):
            continue
        evidencia = str(item.get("evidencia") or "popular")
        if evidencia not in _EVIDENCIAS:
            evidencia = "popular"
        companeros.append(
            CompaneroCultivo(
                id=str(item.get("id") or ""),
                nombre=str(item.get("nombre") or ""),
                beneficio=str(item.get("beneficio") or ""),
                evidencia=evidencia,
            )
        )
    return companeros


def _detalle_desde_fila(fila: dict[str, Any]) -> CultivoDetalleResponse:
    datos = fila.get("datos_json") if isinstance(fila.get("datos_json"), dict) else {}
    reglas = fila.get("reglas_json") if isinstance(fila.get("reglas_json"), dict) else {}
    atributos = reglas_siembra.atributos_cultivo(datos, reglas)
    icono = datos.get("icono") if datos.get("icono") is not None else fila.get("icono")
    return CultivoDetalleResponse(
        id=str(datos.get("id") or fila.get("id") or ""),
        nombre=str(datos.get("nombre") or fila.get("nombre") or ""),
        nombre_cientifico=str(datos.get("nombre_cientifico") or ""),
        ecocrop_nombre=str(datos.get("ecocrop_nombre") or ""),
        categoria=str(datos.get("categoria") or fila.get("categoria") or ""),
        icono=str(icono or ""),
        resumen=str(datos.get("resumen") or ""),
        es_nativa_region=atributos["es_nativa_region"],
        ficha_tecnica=_ficha_tecnica(datos, reglas, atributos),
        restricciones=Restricciones(pet_safe=atributos["pet_safe"], dificultad=atributos["dificultad"]),
        impacto_ambiental=ImpactoAmbiental(
            consumo_hidrico=atributos["consumo_hidrico"],
            atrae_polinizadores=atributos["atrae_polinizadores"],
        ),
        guia_rapida=GuiaRapida(error_comun=atributos["error_comun"]),
        tutorial=_textos(datos.get("tutorial")),
        companeros_cultivo=_companeros(datos.get("companeros_cultivo")),
        curiosidades=_textos(datos.get("curiosidades")),
        ojo=_textos(datos.get("ojo")),
        fuentes=_textos(datos.get("fuentes")),
    )


async def _resolver_lugar(q: str | None, lat: float | None, lon: float | None) -> dict[str, Any]:
    if lat is not None and lon is not None:
        return await open_meteo.resolver_coordenadas(lat, lon)
    if q is not None:
        return await open_meteo.buscar_ubicacion(q)
    raise UbicacionInvalidaError()


def _con_cultivos_afectados(alertas: list[dict[str, Any]], cultivos_db: list[dict]) -> list[dict[str, Any]]:
    return [
        {**alerta, "cultivos_afectados": motor_alertas.cultivos_afectados(alerta["tipo"], cultivos_db)}
        for alerta in alertas
    ]


@router.get(
    "/recomendaciones",
    response_model=RecomendacionesResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def recomendaciones(
    q: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    mes: int | None = Query(default=None, ge=1, le=12),
) -> RecomendacionesResponse:
    lugar = await _resolver_lugar(q, lat, lon)

    mes_evaluado = mes if mes is not None else datetime.now().month
    lat_resuelta = float(lugar["lat"])
    lon_resuelta = float(lugar["lon"])
    altitud_m = int(lugar["altitud_m"])
    lat_grid = round(lat_resuelta, 1)
    lon_grid = round(lon_resuelta, 1)

    cache_clima = await database.get_clima_cache(lat_grid, lon_grid)
    if cache_clima is not None:
        resumen = cache_clima["resumen_mensual_json"]
        periodo = str(cache_clima["periodo_referencia"])
        origen = str(cache_clima.get("origen") or database.ORIGEN_OPEN_METEO)
        fuente = cache_clima.get("fuente")
        desde_cache = True
    else:
        try:
            diarios = await open_meteo.obtener_clima_diario(lat_resuelta, lon_resuelta)
            resumen = clima_processor.procesar_clima_diario(diarios)
            if len(resumen) < 12:  # respuesta incompleta: no se guarda en caché
                raise ClimaNoDisponibleError()
            periodo = _PERIODO_REFERENCIA
            origen, fuente = database.ORIGEN_OPEN_METEO, None
            await database.save_clima_cache(
                lat_grid,
                lon_grid,
                altitud_m,
                periodo,
                resumen,
            )
            desde_cache = False
        except ClimaNoDisponibleError:
            # Open-Meteo saturado o sin respuesta: se usa la estación del SMN más cercana y se guarda
            # con origen "conagua". scripts/precarga_cache.py la reemplaza después por Open-Meteo.
            respaldo = clima_processor.resumen_smn_fallback(lat_resuelta, lon_resuelta, altitud_m=altitud_m)
            if respaldo is None:
                raise
            resumen, periodo, fuente = respaldo
            origen = database.ORIGEN_CONAGUA
            await database.save_clima_cache(
                lat_grid,
                lon_grid,
                altitud_m,
                periodo,
                resumen,
                origen=origen,
                fuente=fuente,
            )
            desde_cache = False

    # El pronóstico se pide aparte en GET /api/alertas (el frontend lo carga con su propio "cargando").
    # Aquí solo se incluye si ya está en caché, para no esperar a Open-Meteo ni fallar si no responde.
    alertas = await database.get_pronostico_cache(lat_grid, lon_grid) or []

    lluvia = lluvia_reciente.obtener_lluvia_reciente(lat_resuelta, lon_resuelta)
    cultivos_db = await database.get_all_cultivos()
    alertas = _con_cultivos_afectados(alertas, cultivos_db)
    cultivos = reglas_siembra.evaluar_cultivos(
        cultivos_db,
        resumen,
        altitud_m,
        mes_evaluado,
    )

    return RecomendacionesResponse(
        ubicacion=UbicacionInfo(
            nombre=str(lugar["nombre"]),
            municipio=str(lugar["municipio"]),
            estado=str(lugar["estado"]),
            lat=lat_resuelta,
            lon=lon_resuelta,
            altitud_m=altitud_m,
            desde_cache=desde_cache,
            alternativas=lugar.get("alternativas") or [],
        ),
        clima_zona=_clima_zona(resumen, mes_evaluado, periodo, lluvia, origen, fuente),
        alertas_7_dias=alertas,
        cultivos=cultivos,
    )


@router.get(
    "/alertas",
    response_model=AlertasResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def alertas(
    q: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
) -> AlertasResponse:
    """Alertas de los próximos 7 días (Open-Meteo Forecast), con los cultivos que afecta cada una.

    Mismos parámetros de ubicación que /api/recomendaciones. Se guarda 1 hora por zona (celda de 0.1°).
    """
    lugar = await _resolver_lugar(q, lat, lon)
    lat_resuelta, lon_resuelta = float(lugar["lat"]), float(lugar["lon"])
    lat_grid, lon_grid = round(lat_resuelta, 1), round(lon_resuelta, 1)
    # 1) Lo guardado en la base de datos (menos de 1 hora). 2) Open-Meteo. 3) Si Open-Meteo falla,
    # el último pronóstico guardado aunque sea viejo. 4) Si no hay nada, lista vacía. Nunca responde 500.
    pronostico = await database.get_pronostico_cache(lat_grid, lon_grid)
    desde_cache = pronostico is not None
    if pronostico is None:
        try:
            pronostico = await open_meteo.obtener_pronostico_7d(lat_resuelta, lon_resuelta)
        except Exception:  # noqa: BLE001 - red, límite 429 o respuesta rara de Open-Meteo
            logger.warning("Pronóstico no disponible para %s, %s; se usa el último guardado", lat_grid, lon_grid, exc_info=True)
            pronostico = await database.get_pronostico_cache(lat_grid, lon_grid, incluir_vencido=True) or []
            desde_cache = True
        else:
            try:
                await database.save_pronostico_cache(lat_grid, lon_grid, pronostico, settings.PRONOSTICO_TTL_SECONDS)
            except Exception:  # noqa: BLE001 - p. ej. base de datos de solo lectura en el servidor
                logger.warning("No se pudo guardar el pronóstico en la caché", exc_info=True)
    return AlertasResponse(
        ubicacion=UbicacionAlertas(nombre=str(lugar["nombre"]), estado=str(lugar["estado"]), lat=lat_resuelta, lon=lon_resuelta),
        alertas_7_dias=_con_cultivos_afectados(pronostico, await database.get_all_cultivos()),
        desde_cache=desde_cache,
    )


@router.get("/ciudades", response_model=list[SugerenciaCiudad])
async def ciudades_sugeridas(
    q: str = Query(default="", max_length=120),
    limite: int = Query(default=10, ge=1, le=20),
) -> list[SugerenciaCiudad]:
    """Sugerencias del buscador: sin `q`, las primeras en orden alfabético; con `q`, las que coinciden."""
    return [SugerenciaCiudad(**s) for s in open_meteo.sugerir_ciudades(q, limite)]


@router.get(
    "/cultivos/{cultivo_id}",
    response_model=CultivoDetalleResponse,
    responses={404: {"model": ErrorResponse}},
)
async def cultivo_detalle(cultivo_id: str) -> CultivoDetalleResponse:
    fila = await database.get_cultivo_by_id(cultivo_id)
    if fila is None:
        raise CultivoNoEncontradoError()
    return _detalle_desde_fila(fila)
