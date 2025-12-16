from typing import Optional, List
from pydantic import BaseModel


class ConnectedAccountResponse(BaseModel):
    """Schema for connected account response."""
    id: str
    platformId: str
    platformName: str
    username: str
    displayName: str
    avatar: Optional[str] = None
    connectedAt: str
    isActive: bool


class PlatformConfig(BaseModel):
    """Schema for platform OAuth configuration."""
    platform_id: str
    platform_name: str
    is_configured: bool
    client_id_set: bool
    client_secret_set: bool
    additional_settings: dict = {}


class PlatformConfigUpdate(BaseModel):
    """Schema for updating platform configuration."""
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    additional_settings: Optional[dict] = None


class ConnectPlatformResponse(BaseModel):
    """Schema for platform connection initiation."""
    auth_url: str
    platform_id: str
