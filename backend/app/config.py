from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_name: str = "Hootsuite Clone"
    debug: bool = True
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Frontend URL
    frontend_url: str = "http://localhost:5173"
    
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "hootsuite_clone"
    
    # Google OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    
    # Facebook OAuth
    facebook_client_id: Optional[str] = None
    facebook_client_secret: Optional[str] = None
    
    # Twitter/X OAuth
    twitter_client_id: Optional[str] = None
    twitter_client_secret: Optional[str] = None
    twitter_bearer_token: Optional[str] = None
    
    # LinkedIn OAuth
    linkedin_client_id: Optional[str] = None
    linkedin_client_secret: Optional[str] = None
    
    # Instagram (uses Facebook Graph API)
    instagram_client_id: Optional[str] = None
    instagram_client_secret: Optional[str] = None
    
    # YouTube (uses Google APIs)
    youtube_client_id: Optional[str] = None
    youtube_client_secret: Optional[str] = None
    
    @property
    def oauth_redirect_base(self) -> str:
        return f"{self.frontend_url.rstrip('/')}"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
