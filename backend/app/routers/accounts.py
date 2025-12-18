import secrets
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends, Query

from app.config import get_settings
from app.schemas.account import (
    ConnectedAccountResponse,
    PlatformConfig,
    PlatformConfigUpdate,
    ConnectPlatformResponse,
)
from app.models.user import User
from app.models.account import ConnectedAccount
from app.services.auth_service import get_current_user
from app.services.platform_service import PlatformService

settings = get_settings()
router = APIRouter(prefix="/accounts", tags=["Accounts"])


# Platform configuration data
PLATFORMS = {
    "twitter": {"name": "Twitter", "color": "#1da1f2"},
    "facebook": {"name": "Facebook", "color": "#1877f2"},
    "instagram": {"name": "Instagram", "color": "#e4405f"},
    "linkedin": {"name": "LinkedIn", "color": "#0a66c2"},
    "youtube": {"name": "YouTube", "color": "#ff0000"},
}


@router.get("", response_model=List[ConnectedAccountResponse])
async def get_connected_accounts(current_user: User = Depends(get_current_user)):
    """Get all connected social media accounts for the current user."""
    accounts = await ConnectedAccount.find(
        ConnectedAccount.user_id == str(current_user.id)
    ).to_list()
    
    return [ConnectedAccountResponse(**acc.to_response()) for acc in accounts]


@router.post("/connect/{platform_id}", response_model=ConnectPlatformResponse)
async def initiate_platform_connection(
    platform_id: str,
    current_user: User = Depends(get_current_user)
):
    """Initiate OAuth flow to connect a social media platform."""
    if platform_id not in PLATFORMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid platform. Must be one of: {', '.join(PLATFORMS.keys())}"
        )
    
    # Check if already connected
    existing = await ConnectedAccount.find_one(
        ConnectedAccount.user_id == str(current_user.id),
        ConnectedAccount.platform_id == platform_id
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Platform {platform_id} is already connected"
        )
    
    # Generate state with user ID for callback
    state = f"{current_user.id}:{secrets.token_urlsafe(16)}"
    
    redirect_uri = f"{settings.frontend_url}/accounts/callback/{platform_id}"
    auth_url = PlatformService.get_connect_url(platform_id, redirect_uri, state)
    
    if not auth_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{platform_id} is not configured. Please add OAuth credentials."
        )
    
    return ConnectPlatformResponse(auth_url=auth_url, platform_id=platform_id)


@router.get("/callback/{platform_id}", response_model=ConnectedAccountResponse)
async def platform_oauth_callback(
    platform_id: str,
    code: str = Query(...),
    state: str = Query(...)
):
    """Handle OAuth callback from social media platform."""
    # Parse user ID from state
    try:
        user_id = state.split(":")[0]
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter"
        )
    
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    redirect_uri = f"{settings.frontend_url}/accounts/callback/{platform_id}"
    
    # Exchange code for token
    token_data = await PlatformService.exchange_platform_code(platform_id, code, redirect_uri)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code"
        )
    
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    
    # Get user info from platform
    platform_user = await PlatformService.get_platform_user_info(platform_id, access_token)
    
    if not platform_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get account information from platform"
        )
    
    # Normalize platform user data
    platform_info = PLATFORMS[platform_id]
    username = ""
    display_name = ""
    platform_user_id = ""
    avatar = None
    page_id = None
    page_access_token = None
    
    if platform_id == "twitter":
        data = platform_user.get("data", {})
        username = f"@{data.get('username', '')}"
        display_name = data.get("name", "")
        platform_user_id = data.get("id", "")
        avatar = data.get("profile_image_url")
    elif platform_id == "facebook":
        # For Facebook, we need to get the Page access token for publishing
        # The 'accounts' field contains the user's Facebook Pages
        accounts = platform_user.get("accounts", {}).get("data", [])
        
        if accounts:
            # Use the first page for now (can add page selection later)
            first_page = accounts[0]
            page_id = first_page.get("id", "")
            page_access_token = first_page.get("access_token", "")
            username = first_page.get("name", "")
            display_name = first_page.get("name", "")
            platform_user_id = first_page.get("id", "")
        else:
            # No pages - use user's personal profile (limited functionality)
            username = platform_user.get("name", "")
            display_name = platform_user.get("name", "")
            platform_user_id = platform_user.get("id", "")
    elif platform_id == "instagram":
        # For Instagram, we need to get the Instagram Business Account ID
        # The endpoint returns Facebook Pages with their connected Instagram accounts
        accounts = platform_user.get("data", [])
        
        ig_account_id = None
        ig_username = None
        fb_page_id = None
        fb_page_access_token = None
        
        # Find a page with a connected Instagram Business Account
        for page in accounts:
            ig_business_account = page.get("instagram_business_account", {})
            if ig_business_account and ig_business_account.get("id"):
                ig_account_id = ig_business_account.get("id")
                fb_page_id = page.get("id")
                
                # We need to get the page access token to use with Instagram
                # Fetch the page details including access token
                import httpx
                async with httpx.AsyncClient() as client:
                    page_url = f"https://graph.facebook.com/v18.0/{fb_page_id}?fields=access_token,instagram_business_account{{username,profile_picture_url,name}}&access_token={access_token}"
                    page_response = await client.get(page_url)
                    if page_response.status_code == 200:
                        page_data = page_response.json()
                        fb_page_access_token = page_data.get("access_token")
                        ig_info = page_data.get("instagram_business_account", {})
                        ig_username = ig_info.get("username", "")
                        avatar = ig_info.get("profile_picture_url")
                        display_name = ig_info.get("name", ig_username)
                break
        
        if not ig_account_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Instagram Business Account found. Please ensure your Facebook Page has an Instagram Business or Creator account connected."
            )
        
        username = f"@{ig_username}" if ig_username else ""
        platform_user_id = ig_account_id
        page_id = ig_account_id  # Store IG account ID in page_id for publishing
        page_access_token = fb_page_access_token  # Use page access token
    elif platform_id == "linkedin":
        username = platform_user.get("name", "")
        display_name = platform_user.get("name", "")
        platform_user_id = platform_user.get("sub", "")
        avatar = platform_user.get("picture")
    elif platform_id == "youtube":
        items = platform_user.get("items", [{}])
        snippet = items[0].get("snippet", {}) if items else {}
        username = snippet.get("title", "")
        display_name = snippet.get("title", "")
        platform_user_id = items[0].get("id", "") if items else ""
        thumbnails = snippet.get("thumbnails", {})
        avatar = thumbnails.get("default", {}).get("url")
    
    # For Facebook, use the page access token instead of user token
    final_access_token = page_access_token if page_access_token else access_token
    
    # Create connected account
    account = ConnectedAccount(
        user_id=str(user.id),
        platform_id=platform_id,
        platform_name=platform_info["name"],
        username=username,
        display_name=display_name,
        avatar=avatar,
        access_token=final_access_token,
        refresh_token=refresh_token,
        platform_user_id=platform_user_id,
        page_id=page_id,
    )
    await account.insert()
    
    return ConnectedAccountResponse(**account.to_response())


@router.delete("/{account_id}")
async def disconnect_account(
    account_id: str,
    current_user: User = Depends(get_current_user)
):
    """Disconnect a social media account."""
    account = await ConnectedAccount.get(account_id)
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    if account.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to disconnect this account"
        )
    
    await account.delete()
    
    return {"message": "Account disconnected successfully"}


@router.patch("/{account_id}/toggle", response_model=ConnectedAccountResponse)
async def toggle_account_status(
    account_id: str,
    current_user: User = Depends(get_current_user)
):
    """Toggle the active status of a connected account."""
    account = await ConnectedAccount.get(account_id)
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    if account.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this account"
        )
    
    account.is_active = not account.is_active
    await account.save()
    
    return ConnectedAccountResponse(**account.to_response())


@router.get("/config", response_model=List[PlatformConfig])
async def get_platform_configs(current_user: User = Depends(get_current_user)):
    """Get configuration status for all platforms."""
    configs = []
    
    for platform_id, info in PLATFORMS.items():
        client_id, client_secret = PlatformService.get_platform_client_credentials(platform_id)
        
        configs.append(PlatformConfig(
            platform_id=platform_id,
            platform_name=info["name"],
            is_configured=bool(client_id and client_secret),
            client_id_set=bool(client_id),
            client_secret_set=bool(client_secret),
        ))
    
    return configs
