"""GET /api/alertas: pronóstico separado de las recomendaciones (el frontend lo carga aparte)."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.api.errors import ClimaNoDisponibleError
from app.core.config import settings

ALERTA = {"tipo": "lluvia_fuerte", "severidad": "alta", "fecha": "2026-11-24",
          "titulo": "Lluvia fuerte esta semana", "mensaje": "Se esperan 51.5 mm de lluvia el martes."}


@pytest.fixture()
def cliente_api(tmp_path: Path):
    settings.DB_PATH = tmp_path / "test_quesiembro.db"
    from app.main import app

    with TestClient(app) as client:
        yield client


def test_alertas_consulta_y_guarda_una_hora(cliente_api: TestClient) -> None:
    with patch("app.api.routes.open_meteo.obtener_pronostico_7d", new=AsyncMock(return_value=[ALERTA])) as pronostico:
        primera = cliente_api.get("/api/alertas", params={"q": "Bacalar"})
        segunda = cliente_api.get("/api/alertas", params={"q": "Bacalar"})
    assert primera.status_code == 200, primera.text
    datos = primera.json()
    assert datos["ubicacion"]["nombre"] == "Bacalar"
    assert datos["alertas_7_dias"][0]["tipo"] == "lluvia_fuerte"
    assert "cultivos_afectados" in datos["alertas_7_dias"][0]
    assert datos["desde_cache"] is False
    assert segunda.json()["desde_cache"] is True
    pronostico.assert_called_once()  # la segunda salió de la caché


def test_semana_sin_alertas_tambien_se_guarda(cliente_api: TestClient) -> None:
    with patch("app.api.routes.open_meteo.obtener_pronostico_7d", new=AsyncMock(return_value=[])) as pronostico:
        cliente_api.get("/api/alertas", params={"q": "Bacalar"})
        respuesta = cliente_api.get("/api/alertas", params={"q": "Bacalar"})
    assert respuesta.json()["alertas_7_dias"] == []
    pronostico.assert_called_once()


def test_errores_de_ubicacion_y_de_open_meteo(cliente_api: TestClient) -> None:
    assert cliente_api.get("/api/alertas").status_code == 400
    assert cliente_api.get("/api/alertas", params={"q": "zzzzz"}).status_code == 404
    with patch("app.api.routes.open_meteo.obtener_pronostico_7d", new=AsyncMock(side_effect=ClimaNoDisponibleError())):
        assert cliente_api.get("/api/alertas", params={"q": "Tulum"}).status_code == 503


def test_recomendaciones_no_esperan_al_pronostico(cliente_api: TestClient) -> None:
    # Si Open-Meteo Forecast falla, /api/recomendaciones sigue respondiendo (sin pedir el pronóstico)
    with patch("app.api.routes.open_meteo.obtener_pronostico_7d", new=AsyncMock(side_effect=ClimaNoDisponibleError())) as pronostico, \
         patch("app.api.routes.open_meteo.obtener_clima_diario", new=AsyncMock(side_effect=ClimaNoDisponibleError())):
        respuesta = cliente_api.get("/api/recomendaciones", params={"lat": 19.43, "lon": -99.13, "mes": 12})
    assert respuesta.status_code == 200, respuesta.text
    pronostico.assert_not_called()


def test_si_open_meteo_falla_no_dice_sin_alertas_ni_lo_guarda(cliente_api: TestClient) -> None:
    # Con la función real: un 429 o una respuesta sin días es error (503), no "sin alertas"
    from app.services.open_meteo import OpenMeteoRateLimitError
    with patch("app.services.open_meteo._get", new=AsyncMock(side_effect=OpenMeteoRateLimitError())):
        assert cliente_api.get("/api/alertas", params={"q": "Tulum"}).status_code == 503
    with patch("app.services.open_meteo._get", new=AsyncMock(return_value={"daily": {}})):
        assert cliente_api.get("/api/alertas", params={"q": "Tulum"}).status_code == 503
    # Nada quedó en caché: cuando Open-Meteo vuelve, se consulta de nuevo
    semana = {"daily": {"time": ["2026-11-21"], "temperature_2m_min": [22], "temperature_2m_max": [30],
                        "precipitation_sum": [0], "wind_gusts_10m_max": [10], "uv_index_max": [5], "weather_code": [1]}}
    with patch("app.services.open_meteo._get", new=AsyncMock(return_value=semana)):
        respuesta = cliente_api.get("/api/alertas", params={"q": "Tulum"})
    assert respuesta.status_code == 200 and respuesta.json()["alertas_7_dias"] == []
    assert respuesta.json()["desde_cache"] is False
