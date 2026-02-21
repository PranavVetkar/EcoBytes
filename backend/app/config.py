from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env relative to this file's location (backend/app/../.env = backend/.env)
# This works regardless of which directory uvicorn is launched from.
_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Firebase Admin
    firebase_service_account_base64: str = ""
    firebase_project_id: str = ""
    firebase_storage_bucket: str = ""
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # OpenAI
    openai_api_key: str = ""

    # JWT — custom auth (replaces Firebase Auth)
    jwt_secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_STRING"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # App
    app_env: str = "development"
    # Stored as a raw comma-separated string; use .cors_origins_list for the split list.
    # pydantic-settings v2 tries to JSON-parse list[str] fields which breaks plain CSV values.
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    log_level: str = "INFO"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
