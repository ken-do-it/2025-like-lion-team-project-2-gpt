"""System-level API schemas."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    environment: str
    version: str


class ErrorResponse(BaseModel):
    code: str
    message: str
