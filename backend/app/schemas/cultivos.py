from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Luz = Literal["pleno_sol", "media_sombra", "sombra"]
Evidencia = Literal["comprobada", "popular"]


class FichaTecnica(BaseModel):
    temp_ideal_c: list[float] = Field(min_length=2, max_length=2)
    temp_limite_c: list[float] = Field(min_length=2, max_length=2)
    tolera_helada: bool
    altitud_max_m: int
    dias_a_cosecha: list[int] = Field(min_length=2, max_length=2)
    maceta_min_litros: int
    profundidad_min_cm: int
    luz: Luz
    riego: str
    sustrato_recomendado: str


class CompaneroCultivo(BaseModel):
    id: str
    nombre: str
    beneficio: str
    evidencia: Evidencia


class MesPrecioSniim(BaseModel):
    mes: int = Field(ge=1, le=12)
    nombre: str
    variacion_pct: int


class EstadoProductor(BaseModel):
    estado: str
    participacion_pct: int


class ContextoEconomicoSniim(BaseModel):
    mercado_referencia: str
    producto_sniim: str
    mes_mas_caro: MesPrecioSniim
    mes_mas_barato: MesPrecioSniim
    estados_productores: list[EstadoProductor]
    tip_ahorro: str


class CultivoDetalleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    nombre: str
    nombre_cientifico: str
    ecocrop_nombre: str
    categoria: str
    icono: str
    resumen: str
    ficha_tecnica: FichaTecnica
    tutorial: list[str]
    companeros_cultivo: list[CompaneroCultivo]
    curiosidades: list[str]
    ojo: list[str]
    contexto_economico_sniim: ContextoEconomicoSniim | None = None
    fuentes: list[str]
