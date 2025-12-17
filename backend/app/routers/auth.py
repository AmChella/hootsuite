from datetime import timedelta
import secrets
from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import EmailStr

from app.config import get_settings
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, SSOAuthUrl, ProfileUpdate, PasswordChange
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
async def sso_authorize(
    request: Request,
    provider: str,
    mobile: bool = Query(False, description="Whether request is from mobile app")
):
    """Get SSO authorization URL for a provider."""
    valid_providers = ["google", "facebook", "twitter", "linkedin"]
    
    if provider not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider. Must be one of: {', '.join(valid_providers)}"
        )
    
    # Generate state for CSRF protection, include mobile flag
    state_data = f"mobile:{mobile}|{secrets.token_urlsafe(32)}"
    
    # Always redirect to backend callback URL
    # The backend will then redirect to mobile app or web app after processing
    base_url = str(request.base_url).rstrip('/')
    redirect_uri = f"{base_url}/auth/sso/{provider}/callback"
    
    auth_url = OAuthService.get_authorization_url(provider, redirect_uri, state_data)
    
    if not auth_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{provider} OAuth is not configured. Please add credentials."
        )
    
    return SSOAuthUrl(auth_url=auth_url, provider=provider)


@router.get("/sso/{provider}/callback")
async def sso_callback(
    request: Request,
    provider: str,
    code: str = Query(...),
    state: str = Query(None)
):
    """Handle SSO OAuth callback and redirect to client with token."""
    # Parse mobile flag from state
    is_mobile = False
    if state and state.startswith("mobile:"):
        is_mobile = state.split("|")[0] == "mobile:True"
    
    # Use backend callback URI (same as what was registered with OAuth provider)
    base_url = str(request.base_url).rstrip('/')
    redirect_uri = f"{base_url}/auth/sso/{provider}/callback"
    
    # Exchange code for token
    token_data = await OAuthService.exchange_code_for_token(provider, code, redirect_uri)
    
    if not token_data:
        # Redirect with error
        error_params = urlencode({"error": "Failed to exchange authorization code"})
        if is_mobile:
            return RedirectResponse(url=f"{settings.mobile_app_scheme}://auth/error?{error_params}")
        return RedirectResponse(url=f"{settings.frontend_url}/login?{error_params}")
    
    access_token = token_data.get("access_token")
    
    # Get user info from provider
    user_info = await OAuthService.get_user_info(provider, access_token)
    
    if not user_info:
        error_params = urlencode({"error": "Failed to get user information"})
        if is_mobile:
            return RedirectResponse(url=f"{settings.mobile_app_scheme}://auth/error?{error_params}")
        return RedirectResponse(url=f"{settings.frontend_url}/login?{error_params}")
    
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
    
    # Redirect to client with token
    if is_mobile:
        # Redirect to mobile app with token
        params = urlencode({"token": jwt_token})
        return RedirectResponse(url=f"{settings.mobile_app_scheme}://auth/callback?{params}")
    else:
        # Redirect to web app with token
        params = urlencode({"token": jwt_token})
        return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?{params}")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return UserResponse(**current_user.to_response())


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout current user (client should discard token)."""
    return {"message": "Successfully logged out"}


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update user profile."""
    # Update fields if provided
    if profile_data.name is not None:
        current_user.name = profile_data.name
    if profile_data.avatar is not None:
        current_user.avatar = profile_data.avatar
    
    await current_user.save()
    return UserResponse(**current_user.to_response())


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user)
):
    """Change user password."""
    # Check if user has a password (not OAuth-only account)
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change password for OAuth-only accounts"
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password length
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    
    # Hash and save new password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await current_user.save()
    
    return {"message": "Password changed successfully"}

