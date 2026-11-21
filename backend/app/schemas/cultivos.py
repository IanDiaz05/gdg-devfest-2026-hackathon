from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Evidencia = Literal["comprobada", "popular"]
Dificultad = Literal["facil", "media", "dificil"]
ConsumoHidrico = Literal["bajo", "medio", "alto"]


class FichaTecnica(BaseModel):
    temp_ideal_c: list[float] = Field(min_length=2, max_length=2)
    temp_limite_c: list[float] = Field(min_length=2, max_length=2)
    tolera_helada: bool
    altitud_max_m: int
    dias_a_cosecha: list[int] = Field(min_length=2, max_length=2)
    maceta_min_litros: int
    profundidad_maceta_cm: int
    luz_nivel: int = Field(ge=1, le=4, description="1 sombra, 2 luz indirecta, 3 sol parcial, 4 pleno sol")
    riego_frecuencia_dias: int = Field(ge=1)
    riego: str
    sustrato_recomendado: str


class Restricciones(BaseModel):
    pet_safe: bool
    dificultad: Dificultad


class ImpactoAmbiental(BaseModel):
    consumo_hidrico: ConsumoHidrico
    atrae_polinizadores: bool


class GuiaRapida(BaseModel):
    error_comun: str


class CompaneroCultivo(BaseModel):
    id: str
    nombre: str
    beneficio: str
    evidencia: Evidencia


class CultivoDetalleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    nombre: str
    nombre_cientifico: str
    ecocrop_nombre: str
    categoria: str
    icono: str
    resumen: str
    es_nativa_region: bool
    ficha_tecnica: FichaTecnica
    restricciones: Restricciones
    impacto_ambiental: ImpactoAmbiental
    guia_rapida: GuiaRapida
    tutorial: list[str]
    companeros_cultivo: list[CompaneroCultivo]
    curiosidades: list[str]
    ojo: list[str]
    fuentes: list[str]
