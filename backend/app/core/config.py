from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    BASE_DIR: Path = _BACKEND_ROOT
    DATA_DIR: Path | None = None
    DB_PATH: Path | None = None
    CORS_ORIGINS: list[str] = Field(default=["*"])
    PRONOSTICO_TTL_SECONDS: int = 3600

    @model_validator(mode="after")
    def _resolver_rutas(self) -> "Settings":
        if self.DATA_DIR is None:
            self.DATA_DIR = self.BASE_DIR / "data"
        if self.DB_PATH is None:
            self.DB_PATH = self.BASE_DIR / "quesiembro.db"
        return self


settings = Settings()
