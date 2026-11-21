from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

NivelSequia = Literal["D0", "D1", "D2", "D3", "D4"]
EstadoCultivo = Literal["optimo", "con_cuidados", "no_ahora"]
Semaforo = Literal["verde", "amarillo", "rojo"]
EspacioTipo = Literal["maceta_chica", "maceta_grande", "patio"]
Luz = Literal["pleno_sol", "media_sombra", "sombra"]
Dificultad = Literal["facil", "media", "dificil"]
TipoAlerta = Literal["helada", "calor"]
SeveridadAlerta = Literal["media", "alta"]


class ErrorResponse(BaseModel):
    error: str
    detail: str
    reintentar_en_s: int | None = None


class AlternativaUbicacion(BaseModel):
    nombre: str
    estado: str
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


class SequiaInfo(BaseModel):
    activa: bool
    nivel: NivelSequia
    nivel_nombre: str
    fecha_dato: str
    consejo: str


class ClimaZona(BaseModel):
    mes_evaluado: int = Field(ge=1, le=12)
    mes_nombre: str
    periodo_referencia: str
    temp_media_c: float
    temp_min_promedio_c: float
    temp_max_promedio_c: float
    anios_con_helada_pct: int
    mes_mas_frio: MesTemperatura
    mes_mas_caluroso: MesTemperatura
    sequia: SequiaInfo | None = None


class Alerta7Dias(BaseModel):
    tipo: TipoAlerta
    severidad: SeveridadAlerta
    titulo: str
    mensaje: str


class FiltrosRapidos(BaseModel):
    maceta_min_litros: int
    espacio_tipo: EspacioTipo
    luz: Luz
    dias_cosecha_aprox: int
    dificultad: Dificultad


class FinanzasSniimSummary(BaseModel):
    mercado_referencia: str
    producto_sniim: str
    mes_cosecha_estimado: int = Field(ge=1, le=12)
    variacion_precio_pct: int
    destacar_ahorro: bool
    mensaje_ahorro: str | None = None


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
    finanzas_sniim: FinanzasSniimSummary | None = None


class RecomendacionesResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ubicacion: UbicacionInfo
    clima_zona: ClimaZona
    alertas_7_dias: list[Alerta7Dias]
    cultivos: list[CultivoRecomendado]
