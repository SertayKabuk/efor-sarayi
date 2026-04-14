from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(validation_alias="DATABASE_URL")
    root_path: str = Field(default="", validation_alias=AliasChoices("ROOT_PATH", "APP_ROOT_PATH"))
    openai_api_key: str = Field(validation_alias="OPENAI_API_KEY")
    azure_endpoint: str = Field(validation_alias="AZURE_ENDPOINT")
    azure_deployment_name: str = Field(validation_alias="AZURE_DEPLOYMENT_NAME")
    azure_embedding_endpoint: str = Field(validation_alias="AZURE_EMBEDDING_ENDPOINT")
    azure_embedding_deployment_name: str = Field(validation_alias="AZURE_EMBEDDING_DEPLOYMENT_NAME")
    azure_embedding_api_key: str = Field(validation_alias="AZURE_EMBEDDING_API_KEY")
    chroma_host: str = Field(validation_alias="CHROMA_HOST")
    chroma_port: int = Field(validation_alias="CHROMA_PORT")
    upload_dir: str = Field(validation_alias=AliasChoices("UPLOAD_DIR", "UPLOADS_DIR"))
    google_client_id: str = Field(validation_alias="GOOGLE_CLIENT_ID")
    jwt_secret: str = Field(validation_alias="JWT_SECRET")
    allowed_domain: str = Field(validation_alias="ALLOWED_DOMAIN")
    allow_seed_bypass_auth: bool = Field(validation_alias="ALLOW_SEED_BYPASS_AUTH")
    seed_auth_token: str = Field(validation_alias="SEED_AUTH_TOKEN")

    @field_validator("allowed_domain", mode="before")
    @classmethod
    def normalize_allowed_domain(cls, value: str) -> str:
        return str(value).strip().lstrip("@").lower()

    @field_validator("root_path", mode="before")
    @classmethod
    def normalize_root_path(cls, value: str | None) -> str:
        if value is None:
            return ""

        normalized = str(value).strip()
        if normalized in {"", "/"}:
            return ""

        if not normalized.startswith("/"):
            normalized = f"/{normalized}"

        return normalized.rstrip("/")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
