from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EstadoCultivo = Literal["optimo", "con_cuidados", "no_ahora"]
Semaforo = Literal["verde", "amarillo", "rojo"]
EspacioTipo = Literal["maceta_chica", "maceta_grande", "patio"]
Dificultad = Literal["facil", "media", "dificil"]
ConsumoHidrico = Literal["bajo", "medio", "alto"]
TipoAlerta = Literal["helada", "calor", "lluvia_fuerte", "tormenta", "viento", "uv"]
SeveridadAlerta = Literal["media", "alta"]
OrigenClima = Literal["open-meteo", "conagua"]


class ErrorResponse(BaseModel):
    error: str
    detail: str
    reintentar_en_s: int | None = None


class AlternativaUbicacion(BaseModel):
    nombre: str
    estado: str
    lat: float
    lon: float


class SugerenciaCiudad(BaseModel):
    """Opción del buscador (`GET /api/ciudades`). `etiqueta` es lo que se muestra y se manda como `q`."""

    nombre: str
    estado: str
    municipio: str
    etiqueta: str
    lat: float
    lon: float


class UbicacionInfo(BaseModel):
    nombre: str
    municipio: str
    estado: str
    lat: float
    lon: float
    altitud_m: int
    desde_cache: bool
    alternativas: list[AlternativaUbicacion]


class MesTemperatura(BaseModel):
    mes: int = Field(ge=1, le=12)
    nombre: str
    temp_media_c: float


class LluviaReciente(BaseModel):
    """Último mes publicado por el SMN (CONAGUA) en la estación más cercana."""

    fuente: str
    estacion: str
    distancia_km: float
    mes: str = Field(description="AAAA-MM")
    lluvia_mm: float
    normal_mm: float | None = None
    anomalia_pct: int | None = None
    temp_min_c: float | None = None
    temp_max_c: float | None = None
    mensaje: str
    consejo: str


class EstacionClima(BaseModel):
    """Estación del SMN usada para el clima típico cuando `origen` es "conagua"."""

    estacion: str
    clave: str
    distancia_km: float
    heladas_estimadas: bool = Field(
        description="El SMN solo publica promedios mensuales: el % de heladas se estima con la mínima promedio",
    )


class ClimaZona(BaseModel):
    mes_evaluado: int = Field(ge=1, le=12)
    mes_nombre: str
    periodo_referencia: str
    origen: OrigenClima = Field(
        default="open-meteo",
        description="De dónde sale el clima típico: Open-Meteo (modelo, punto exacto) o CONAGUA (estación cercana)",
    )
    estacion_smn: EstacionClima | None = None
    temp_media_c: float
    temp_min_promedio_c: float
    temp_max_promedio_c: float
    anios_con_helada_pct: int
    lluvia_mes_mm: float | None = None
    mes_mas_frio: MesTemperatura
    mes_mas_caluroso: MesTemperatura
    lluvia_reciente: LluviaReciente | None = None


class Alerta7Dias(BaseModel):
    tipo: TipoAlerta
    severidad: SeveridadAlerta
    fecha: str
    titulo: str
    mensaje: str
    cultivos_afectados: list[str] = Field(default_factory=list)


class FiltrosRapidos(BaseModel):
    maceta_min_litros: int
    espacio_tipo: EspacioTipo
    profundidad_maceta_cm: int
    luz_nivel: int = Field(ge=1, le=4, description="1 sombra, 2 luz indirecta, 3 sol parcial, 4 pleno sol")
    riego_frecuencia_dias: int = Field(ge=1)
    consumo_hidrico: ConsumoHidrico
    pet_safe: bool
    atrae_polinizadores: bool
    es_nativa_region: bool
    dias_cosecha_aprox: int
    dificultad: Dificultad


class CultivoRecomendado(BaseModel):
    id: str
    nombre: str
    icono: str
    categoria: str
    estado: EstadoCultivo
    semaforo: Semaforo
    razon_corta: str
    etiqueta_clima: str
    meses_ideales: list[int]
    meses_posibles: list[int]
    filtros_rapidos: FiltrosRapidos


class RecomendacionesResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ubicacion: UbicacionInfo
    clima_zona: ClimaZona
    alertas_7_dias: list[Alerta7Dias]
    cultivos: list[CultivoRecomendado]
