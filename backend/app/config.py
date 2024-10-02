from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    OPENAI_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_KEY: str


# config = Config(_env_file=".env", extra="ignore")
config = Config()
