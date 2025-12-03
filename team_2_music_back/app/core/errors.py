"""Error handling utilities and handlers."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette import status
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.system import ErrorResponse


DEFAULT_MESSAGE = "An unexpected error occurred"


def _error_response(code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(code=code, message=message).model_dump(),
    )


def register_error_handlers(app: FastAPI) -> None:
    """Attach global exception handlers for consistent error shapes."""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else DEFAULT_MESSAGE
        code = detail if detail.isupper() else "HTTP_ERROR"
        return _error_response(code=code, message=detail, status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        return _error_response(code="VALIDATION_FAILED", message=str(exc.errors()), status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

    @app.exception_handler(ValidationError)
    async def pydantic_validation_handler(request: Request, exc: ValidationError) -> JSONResponse:
        return _error_response(code="VALIDATION_FAILED", message=str(exc.errors()), status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        return _error_response(code="INTERNAL_SERVER_ERROR", message=DEFAULT_MESSAGE, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
