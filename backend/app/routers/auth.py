from datetime import timedelta
import secrets
from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import RedirectResponse
from pydantic import EmailStr

from app.config import get_settings
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, SSOAuthUrl
from app.models.user import User
from app.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.services.oauth_service import OAuthService

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user with email and password."""
    # Check if user exists
    existing_user = await User.find_one(User.email == user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        name=user_data.name,
    )
    await user.insert()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse(**user.to_response())
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login with email and password."""
    user = await User.find_one(User.email == credentials.email)
    
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse(**user.to_response())
    )


@router.get("/sso/{provider}", response_model=SSOAuthUrl)
async def sso_authorize(provider: str):
    """Get SSO authorization URL for a provider."""
    valid_providers = ["google", "facebook", "twitter", "linkedin"]
    
    if provider not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider. Must be one of: {', '.join(valid_providers)}"
        )
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    
    redirect_uri = f"{settings.frontend_url}/auth/callback/{provider}"
    auth_url = OAuthService.get_authorization_url(provider, redirect_uri, state)
    
    if not auth_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{provider} OAuth is not configured. Please add credentials."
        )
    
    return SSOAuthUrl(auth_url=auth_url, provider=provider)


@router.get("/sso/{provider}/callback", response_model=Token)
async def sso_callback(
    provider: str,
    code: str = Query(...),
    state: str = Query(None)
):
    """Handle SSO OAuth callback."""
    redirect_uri = f"{settings.frontend_url}/auth/callback/{provider}"
    
    # Exchange code for token
    token_data = await OAuthService.exchange_code_for_token(provider, code, redirect_uri)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code"
        )
    
    access_token = token_data.get("access_token")
    
    # Get user info from provider
    user_info = await OAuthService.get_user_info(provider, access_token)
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user information from provider"
        )
    
    # Normalize user info
    normalized = OAuthService.normalize_user_info(provider, user_info)
    
    # Find or create user
    user = await User.find_one(
        User.oauth_provider == provider,
        User.oauth_id == normalized["id"]
    )
    
    if not user:
        # Check if email exists (link accounts)
        if normalized.get("email"):
            user = await User.find_one(User.email == normalized["email"])
        
        if not user:
            # Create new user
            user = User(
                email=normalized.get("email") or f"{normalized['id']}@{provider}.oauth",
                name=normalized.get("name", "User"),
                avatar=normalized.get("avatar"),
                oauth_provider=provider,
                oauth_id=normalized["id"],
                is_verified=True,  # SSO users are pre-verified
            )
            await user.insert()
        else:
            # Link OAuth to existing account
            user.oauth_provider = provider
            user.oauth_id = normalized["id"]
            if normalized.get("avatar") and not user.avatar:
                user.avatar = normalized["avatar"]
            await user.save()
    
    # Create JWT token
    jwt_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return Token(
        access_token=jwt_token,
        user=UserResponse(**user.to_response())
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return UserResponse(**current_user.to_response())


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout current user (client should discard token)."""
    return {"message": "Successfully logged out"}
