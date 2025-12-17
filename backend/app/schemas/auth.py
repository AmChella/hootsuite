from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response."""
    id: str
    email: str
    name: str
    avatar: Optional[str] = None


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for token payload data."""
    user_id: Optional[str] = None
    email: Optional[str] = None


class SSOAuthUrl(BaseModel):
    """Schema for SSO authorization URL response."""
    auth_url: str
    provider: str


class ProfileUpdate(BaseModel):
    """Schema for profile update."""
    name: Optional[str] = None
    avatar: Optional[str] = None


class PasswordChange(BaseModel):
    """Schema for password change."""
    current_password: str
    new_password: str
