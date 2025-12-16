from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import EmailStr, Field


class User(Document):
    """User model for authentication and profile."""
    
    email: EmailStr
    hashed_password: Optional[str] = None  # None for SSO users
    name: str
    avatar: Optional[str] = None
    
    # OAuth provider info (for SSO users)
    oauth_provider: Optional[str] = None  # google, facebook, twitter, linkedin
    oauth_id: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Account status
    is_active: bool = True
    is_verified: bool = False
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            [("oauth_provider", 1), ("oauth_id", 1)],
        ]
    
    def to_response(self) -> dict:
        """Convert to API response format."""
        return {
            "id": str(self.id),
            "email": self.email,
            "name": self.name,
            "avatar": self.avatar,
        }
