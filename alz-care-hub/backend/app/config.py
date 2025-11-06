from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    app_name: str = "Alzheimer's Care Hub API"
    database_url: str = Field(
        default="sqlite:///./app/data/alz_care.db",
        description="SQLAlchemy database URL",
    )
    allow_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"],
        description="CORS allowed origins for local dev",
    )


settings = Settings()
