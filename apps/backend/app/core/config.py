from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "media-processing-platform"
    debug: bool = True

    class Config:
        env_file = ".env"


settings = Settings()