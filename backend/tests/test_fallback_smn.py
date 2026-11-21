"""Verifica el respaldo SMN-CONAGUA cuando Open-Meteo responde 429/503."""
from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.api.errors import ClimaNoDisponibleError
from app.core.config import settings
from app.engine import clima_processor
from app.services.open_meteo import OpenMeteoRateLimitError, PERIODO_REFERENCIA


@pytest.fixture()
def cliente_api(tmp_path: Path):
    db_path = tmp_path / "test_quesiembro.db"
    settings.DB_PATH = db_path
    from app.main import app

    with TestClient(app) as client:
        yield client


def _assert_contrato_v31(payload: dict[str, Any]) -> None:
    assert "ubicacion" in payload
    assert "clima_zona" in payload
    assert "alertas_7_dias" in payload
    assert "cultivos" in payload

    ubicacion = payload["ubicacion"]
    for campo in ("nombre", "municipio", "estado", "lat", "lon", "altitud_m", "desde_cache", "alternativas"):
        assert campo in ubicacion

    clima = payload["clima_zona"]
    for campo in (
        "mes_evaluado",
        "mes_nombre",
        "periodo_referencia",
        "temp_media_c",
        "temp_min_promedio_c",
        "temp_max_promedio_c",
        "anios_con_helada_pct",
        "lluvia_mes_mm",
        "mes_mas_frio",
        "mes_mas_caluroso",
        "lluvia_reciente",
    ):
        assert campo in clima

    assert 1 <= int(clima["mes_evaluado"]) <= 12
    assert isinstance(clima["temp_media_c"], (int, float))
    assert isinstance(clima["anios_con_helada_pct"], int)
    assert "mes" in clima["mes_mas_frio"]
    assert "nombre" in clima["mes_mas_frio"]
    assert isinstance(payload["alertas_7_dias"], list)
    assert isinstance(payload["cultivos"], list)
    assert len(payload["cultivos"]) >= 1


def test_periodo_referencia_es_10_anios() -> None:
    assert PERIODO_REFERENCIA == "2016-2025"
    from app.services import open_meteo

    assert open_meteo.PERIODO_INICIO == "2016-01-01"
    assert open_meteo.PERIODO_FIN == "2025-12-31"


def test_estimar_heladas_desde_tmin() -> None:
    assert clima_processor._estimar_heladas_desde_tmin(-3.0) == (100, 100)
    assert clima_processor._estimar_heladas_desde_tmin(-0.5) == (100, 50)
    assert clima_processor._estimar_heladas_desde_tmin(1.5) == (100, 0)
    assert clima_processor._estimar_heladas_desde_tmin(5.0) == (0, 0)


def test_resumen_smn_fallback_cdmx() -> None:
    # Ciudad de Mexico: debe haber estacion SMN cerca
    resultado = clima_processor.resumen_smn_fallback(19.43, -99.13)
    assert resultado is not None
    resumen, periodo = resultado
    assert len(resumen) == 12
    assert periodo.startswith("SMN-CONAGUA")
    for item in resumen:
        assert "temp_media_c" in item
        assert "temp_min_promedio_c" in item
        assert "temp_max_promedio_c" in item
        assert "anios_con_helada_pct" in item
        assert "anios_con_helada_fuerte_pct" in item
        assert "lluvia_mm" in item


@pytest.mark.parametrize(
    "exc",
    [OpenMeteoRateLimitError(), ClimaNoDisponibleError()],
    ids=["429", "503"],
)
def test_recomendaciones_fallback_smn_cuando_open_meteo_falla(
    cliente_api: TestClient,
    exc: Exception,
) -> None:
    # Celda sin cache: coords de CDMX redondeadas a 0.1°
    lat, lon = 19.43, -99.13

    with (
        patch(
            "app.api.routes.open_meteo.obtener_diario_30_anios",
            new=AsyncMock(side_effect=exc),
        ),
        patch(
            "app.api.routes.open_meteo.obtener_pronostico_7d",
            new=AsyncMock(return_value=[]),
        ),
        patch(
            "app.api.routes.database.get_clima_cache",
            new=AsyncMock(return_value=None),
        ),
        patch(
            "app.api.routes.database.save_clima_cache",
            new=AsyncMock(),
        ) as save_mock,
    ):
        respuesta = cliente_api.get(
            "/api/recomendaciones",
            params={"lat": lat, "lon": lon, "mes": 12},
        )

    assert respuesta.status_code == 200, respuesta.text
    payload = respuesta.json()
    _assert_contrato_v31(payload)
    assert payload["ubicacion"]["desde_cache"] is False
    assert str(payload["clima_zona"]["periodo_referencia"]).startswith("SMN-CONAGUA")
    assert payload["alertas_7_dias"] == []
    save_mock.assert_not_called()
