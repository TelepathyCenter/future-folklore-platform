from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "Future Folklore Platform"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:4200"]

    # Supabase (Layer 0.2)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Database (Layer 0.2)
    database_url: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
