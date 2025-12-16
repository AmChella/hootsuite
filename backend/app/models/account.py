from datetime import datetime
from typing import Optional
from beanie import Document, Link
from pydantic import Field

from app.models.user import User


class ConnectedAccount(Document):
    """Social media account connected by a user."""
    
    user_id: str  # Reference to User
    platform_id: str  # twitter, facebook, instagram, linkedin, youtube
    platform_name: str
    
    # Account info from OAuth
    username: str
    display_name: str
    avatar: Optional[str] = None
    
    # OAuth tokens (encrypted in production)
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    
    # Platform-specific data
    platform_user_id: str  # ID on the platform
    page_id: Optional[str] = None  # For Facebook/Instagram pages
    
    # Status
    is_active: bool = True
    connected_at: datetime = Field(default_factory=datetime.utcnow)
    last_used_at: Optional[datetime] = None
    
    class Settings:
        name = "connected_accounts"
        indexes = [
            "user_id",
            "platform_id",
            [("user_id", 1), ("platform_id", 1)],
        ]
    
    def to_response(self) -> dict:
        """Convert to API response format (without sensitive tokens)."""
        return {
            "id": str(self.id),
            "platformId": self.platform_id,
            "platformName": self.platform_name,
            "username": self.username,
            "displayName": self.display_name,
            "avatar": self.avatar,
            "connectedAt": self.connected_at.isoformat(),
            "isActive": self.is_active,
        }
