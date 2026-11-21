"""Integracion GPS y contrato v3.1 de GET /api/recomendaciones."""
from __future__ import annotations

import asyncio
from typing import Any
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from tests.test_fallback_smn import _assert_contrato_v31


def _cliente() -> httpx.AsyncClient:
    from app.main import app

    return httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://testserver",
    )


def _por_id(payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {item["id"]: item for item in payload["cultivos"]}


def _get(path: str, params: dict[str, Any] | None = None) -> httpx.Response:
    async def _run() -> httpx.Response:
        async with _cliente() as client:
            with patch(
                "app.api.routes.open_meteo.obtener_pronostico_7d",
                new=AsyncMock(return_value=[]),
            ):
                return await client.get(path, params=params)

    return asyncio.run(_run())


def test_recomendaciones_merida_gps_contrato_v31() -> None:
    respuesta = _get("/api/recomendaciones", {"lat": 20.97, "lon": -89.62, "mes": 12})
    assert respuesta.status_code == 200, respuesta.text
    payload = respuesta.json()
    _assert_contrato_v31(payload)
    assert payload["ubicacion"]["estado"] == "Yucatán"
    assert payload["ubicacion"]["municipio"]
    assert payload["clima_zona"]["mes_evaluado"] == 12


def test_recomendaciones_toluca_nopal_hierbabuena_no_rechazados_por_rangos_viejos() -> None:
    respuesta = _get("/api/recomendaciones", {"lat": 19.28, "lon": -99.65, "mes": 12})
    assert respuesta.status_code == 200, respuesta.text
    payload = respuesta.json()
    _assert_contrato_v31(payload)
    assert payload["ubicacion"]["nombre"] in {"Toluca", "Tu ubicación"}
    cultivos = _por_id(payload)
    assert "nopal" in cultivos
    assert "hierbabuena" in cultivos
    for cultivo_id in ("nopal", "hierbabuena"):
        item = cultivos[cultivo_id]
        razon = str(item["razon_corta"]).lower()
        if item["estado"] == "no_ahora":
            assert "10 °c" not in razon
            assert "necesita al menos 10" not in razon
            assert "3 °c" not in razon
            assert "necesita al menos 3" not in razon


def test_recomendaciones_sin_ubicacion_400() -> None:
    respuesta = _get("/api/recomendaciones", {"mes": 12})
    assert respuesta.status_code == 400, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["error"] == "ubicacion_invalida"


def test_recomendaciones_mes_invalido_422() -> None:
    respuesta = _get("/api/recomendaciones", {"lat": 19.28, "lon": -99.65, "mes": 13})
    assert respuesta.status_code == 422, respuesta.text


def test_recomendaciones_ciudad_inexistente_404() -> None:
    respuesta = _get("/api/recomendaciones", {"q": "CiudadInexistenteXYZ"})
    assert respuesta.status_code == 404, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["error"] == "ciudad_no_encontrada"


@pytest.mark.parametrize(
    ("cultivo_id", "pet_safe"),
    [
        ("cebolla", False),
        ("ajo", False),
        ("jitomate", False),
        ("papa", False),
        ("chile_serrano", False),
        ("epazote", False),
        ("albahaca", True),
        ("cilantro", True),
        ("romero", True),
        ("lechuga", True),
        ("zanahoria", True),
        ("calabacita", True),
        ("fresa", True),
        ("nopal", True),
        ("hierbabuena", True),
    ],
)
def test_detalle_pet_safe(cultivo_id: str, pet_safe: bool) -> None:
    async def _run() -> httpx.Response:
        async with _cliente() as client:
            return await client.get(f"/api/cultivos/{cultivo_id}")

    respuesta = asyncio.run(_run())
    assert respuesta.status_code == 200, respuesta.text
    payload = respuesta.json()
    assert payload["restricciones"]["pet_safe"] is pet_safe
    if cultivo_id in {"nopal", "hierbabuena"}:
        assert payload["fuentes"]
        assert payload["ficha_tecnica"]["tolera_helada"] is True
    if cultivo_id == "nopal":
        assert payload["ficha_tecnica"]["temp_ideal_c"] == [18.0, 30.0]
        assert payload["ficha_tecnica"]["temp_limite_c"] == [2.0, 42.0]
        assert payload["ficha_tecnica"]["altitud_max_m"] == 2800
    if cultivo_id == "hierbabuena":
        assert payload["ficha_tecnica"]["temp_ideal_c"] == [15.0, 25.0]
        assert payload["ficha_tecnica"]["temp_limite_c"] == [2.0, 32.0]
