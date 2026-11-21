from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class UbicacionInvalidaError(Exception):
    pass


class CiudadNoEncontradaError(Exception):
    pass


class CultivoNoEncontradoError(Exception):
    pass


class ClimaNoDisponibleError(Exception):
    pass


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(UbicacionInvalidaError)
    async def ubicacion_invalida(_request: Request, _exc: UbicacionInvalidaError) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={
                "error": "ubicacion_invalida",
                "detail": "Debes enviar el parametro 'q' o el par 'lat' y 'lon'.",
            },
        )

    @app.exception_handler(CiudadNoEncontradaError)
    async def ciudad_no_encontrada(_request: Request, _exc: CiudadNoEncontradaError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={
                "error": "ciudad_no_encontrada",
                "detail": "No encontramos esa ubicacion en Mexico.",
            },
        )

    @app.exception_handler(CultivoNoEncontradoError)
    async def cultivo_no_encontrado(_request: Request, _exc: CultivoNoEncontradoError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={
                "error": "cultivo_no_encontrado",
                "detail": "El cultivo solicitado no existe en el catalogo.",
            },
        )

    @app.exception_handler(ClimaNoDisponibleError)
    async def clima_no_disponible(_request: Request, _exc: ClimaNoDisponibleError) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={
                "error": "clima_no_disponible",
                "detail": "El servicio meteorologico esta saturado.",
                "reintentar_en_s": 60,
            },
        )
