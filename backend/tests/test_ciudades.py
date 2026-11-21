"""Buscador de ciudades: GET /api/ciudades (sugerencias) y búsqueda de la capital en español."""
from __future__ import annotations

import asyncio
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.services import open_meteo
from app.services.datos_locales import normalizar


@pytest.fixture()
def cliente_api(tmp_path: Path):
    settings.DB_PATH = tmp_path / "test_quesiembro.db"
    from app.main import app

    with TestClient(app) as client:
        yield client


def test_sin_texto_devuelve_10_en_orden_alfabetico(cliente_api: TestClient) -> None:
    respuesta = cliente_api.get("/api/ciudades")
    assert respuesta.status_code == 200
    sugerencias = respuesta.json()
    assert len(sugerencias) == 10
    claves = [(normalizar(s["nombre"]), normalizar(s["estado"])) for s in sugerencias]
    assert claves == sorted(claves)
    for s in sugerencias:
        assert s["etiqueta"] == f"{s['nombre']}, {s['estado']}"


def test_con_texto_ignora_acentos_y_prioriza_inicio() -> None:
    sugerencias = open_meteo.sugerir_ciudades("merida")
    assert sugerencias[0]["etiqueta"] == "Mérida, Yucatán"
    etiquetas = [s["etiqueta"] for s in open_meteo.sugerir_ciudades("carmen", 20)]
    assert any(e.startswith("Playa del Carmen") for e in etiquetas)  # palabra que empieza con "carmen"


def test_filtro_por_estado_y_por_nombre_de_estado() -> None:
    con_coma = open_meteo.sugerir_ciudades("san juan, jal", 20)
    assert con_coma and all(s["estado"] == "Jalisco" for s in con_coma)
    # Primero los lugares cuyo nombre coincide; después, los del estado que coincide
    solo_estado = open_meteo.sugerir_ciudades("quintana", 20)
    assert any(s["estado"] == "Quintana Roo" for s in solo_estado)
    assert all(s["estado"] == "Quintana Roo" or "quintana" in normalizar(s["nombre"]) for s in solo_estado)


def test_sin_resultados_y_limite(cliente_api: TestClient) -> None:
    assert cliente_api.get("/api/ciudades", params={"q": "zzzzz"}).json() == []
    assert len(cliente_api.get("/api/ciudades", params={"q": "san", "limite": 3}).json()) == 3
    assert cliente_api.get("/api/ciudades", params={"limite": 50}).status_code == 422


def test_capital_se_busca_en_espanol() -> None:
    lugar = asyncio.run(open_meteo.buscar_ubicacion("Ciudad de México"))
    assert lugar["nombre"] == "Ciudad de México"
    assert open_meteo.sugerir_ciudades("ciudad de mex")[0]["etiqueta"] == "Ciudad de México, Ciudad de México"
