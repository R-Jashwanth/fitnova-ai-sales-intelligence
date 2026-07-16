import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "FitNova AI Sales Intelligence"
    database_url: str = "sqlite:///./database/fitnova.db"
    gemini_api_key: str = ""
    app_url: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
