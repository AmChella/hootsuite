from typing import Optional, Dict, Any
from urllib.parse import urlencode
import httpx

from app.config import get_settings

settings = get_settings()


class OAuthService:
    """Service for handling OAuth authentication with various providers."""
    
    # OAuth endpoints for each provider
    OAUTH_CONFIGS = {
        "google": {
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "userinfo_url": "https://www.googleapis.com/oauth2/v2/userinfo",
            "scopes": ["openid", "email", "profile"],
        },
        "facebook": {
            "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
            "userinfo_url": "https://graph.facebook.com/me?fields=id,name,email,picture",
            "scopes": ["email", "public_profile"],
        },
        "twitter": {
            "auth_url": "https://twitter.com/i/oauth2/authorize",
            "token_url": "https://api.twitter.com/2/oauth2/token",
            "userinfo_url": "https://api.twitter.com/2/users/me",
            "scopes": ["tweet.read", "users.read", "offline.access"],
        },
        "linkedin": {
            "auth_url": "https://www.linkedin.com/oauth/v2/authorization",
            "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
            "userinfo_url": "https://api.linkedin.com/v2/userinfo",
            "scopes": ["openid", "profile", "email"],
        },
    }
    
    @classmethod
    def get_client_credentials(cls, provider: str) -> tuple[Optional[str], Optional[str]]:
        """Get OAuth client credentials for a provider."""
        credentials = {
            "google": (settings.google_client_id, settings.google_client_secret),
            "facebook": (settings.facebook_client_id, settings.facebook_client_secret),
            "twitter": (settings.twitter_client_id, settings.twitter_client_secret),
            "linkedin": (settings.linkedin_client_id, settings.linkedin_client_secret),
        }
        return credentials.get(provider, (None, None))
    
    @classmethod
    def get_authorization_url(cls, provider: str, redirect_uri: str, state: str) -> Optional[str]:
        """Generate the OAuth authorization URL for a provider."""
        if provider not in cls.OAUTH_CONFIGS:
            return None
        
        client_id, _ = cls.get_client_credentials(provider)
        if not client_id:
            return None
        
        config = cls.OAUTH_CONFIGS[provider]
        
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(config["scopes"]),
            "state": state,
        }
        
        # Twitter requires PKCE
        if provider == "twitter":
            params["code_challenge"] = state  # Simplified; use proper PKCE in production
            params["code_challenge_method"] = "plain"
        
        return f"{config['auth_url']}?{urlencode(params)}"
    
    @classmethod
    async def exchange_code_for_token(
        cls, provider: str, code: str, redirect_uri: str
    ) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access token."""
        if provider not in cls.OAUTH_CONFIGS:
            return None
        
        client_id, client_secret = cls.get_client_credentials(provider)
        if not client_id or not client_secret:
            return None
        
        config = cls.OAUTH_CONFIGS[provider]
        
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(config["token_url"], data=data)
            
            if response.status_code == 200:
                return response.json()
            
        return None
    
    @classmethod
    async def get_user_info(
        cls, provider: str, access_token: str
    ) -> Optional[Dict[str, Any]]:
        """Get user information from the OAuth provider."""
        if provider not in cls.OAUTH_CONFIGS:
            return None
        
        config = cls.OAUTH_CONFIGS[provider]
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(config["userinfo_url"], headers=headers)
            
            if response.status_code == 200:
                return response.json()
        
        return None
    
    @classmethod
    def normalize_user_info(cls, provider: str, user_info: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize user info from different providers to a common format."""
        if provider == "google":
            return {
                "id": user_info.get("id"),
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "avatar": user_info.get("picture"),
            }
        elif provider == "facebook":
            return {
                "id": user_info.get("id"),
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "avatar": user_info.get("picture", {}).get("data", {}).get("url"),
            }
        elif provider == "twitter":
            data = user_info.get("data", {})
            return {
                "id": data.get("id"),
                "email": None,  # Twitter doesn't provide email in basic scope
                "name": data.get("name"),
                "avatar": data.get("profile_image_url"),
            }
        elif provider == "linkedin":
            return {
                "id": user_info.get("sub"),
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "avatar": user_info.get("picture"),
            }
        
        return user_info
