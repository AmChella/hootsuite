from typing import Optional, Dict, Any, List
from datetime import datetime
import httpx

from app.config import get_settings
from app.models.account import ConnectedAccount

settings = get_settings()


class PlatformService:
    """Service for interacting with social media platform APIs."""
    
    # Platform OAuth configurations for account connection
    PLATFORM_OAUTH_CONFIGS = {
        "twitter": {
            "auth_url": "https://twitter.com/i/oauth2/authorize",
            "token_url": "https://api.twitter.com/2/oauth2/token",
            "scopes": ["tweet.read", "tweet.write", "users.read", "offline.access"],
            "post_url": "https://api.twitter.com/2/tweets",
        },
        "facebook": {
            "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
            "scopes": ["pages_read_engagement", "pages_show_list", "public_profile", "pages_manage_posts"],
            "post_url": "https://graph.facebook.com/v18.0/{page_id}/feed",
        },
        "instagram": {
            "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
            # pages_show_list and pages_read_engagement are needed to access the Facebook Page
            # instagram_basic and instagram_content_publish are needed for Instagram
            "scopes": ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"],
            "post_url": "https://graph.facebook.com/v18.0/{ig_user_id}/media",
        },
        "linkedin": {
            "auth_url": "https://www.linkedin.com/oauth/v2/authorization",
            "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
            "scopes": ["w_member_social", "r_liteprofile"],
            "post_url": "https://api.linkedin.com/v2/ugcPosts",
        },
        "youtube": {
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "scopes": ["https://www.googleapis.com/auth/youtube.upload"],
            "post_url": "https://www.googleapis.com/upload/youtube/v3/videos",
        },
    }
    
    @classmethod
    def get_platform_client_credentials(cls, platform_id: str) -> tuple[Optional[str], Optional[str]]:
        """Get OAuth client credentials for a social media platform."""
        credentials = {
            "twitter": (settings.twitter_client_id, settings.twitter_client_secret),
            "facebook": (settings.facebook_client_id, settings.facebook_client_secret),
            # Instagram uses the same Facebook App credentials (Graph API)
            "instagram": (settings.facebook_client_id, settings.facebook_client_secret),
            "linkedin": (settings.linkedin_client_id, settings.linkedin_client_secret),
            "youtube": (settings.youtube_client_id, settings.youtube_client_secret),
        }
        return credentials.get(platform_id, (None, None))
    
    @classmethod
    def get_connect_url(cls, platform_id: str, redirect_uri: str, state: str) -> Optional[str]:
        """Generate the OAuth authorization URL to connect a social media account."""
        if platform_id not in cls.PLATFORM_OAUTH_CONFIGS:
            return None
        
        client_id, _ = cls.get_platform_client_credentials(platform_id)
        if not client_id:
            return None
        
        config = cls.PLATFORM_OAUTH_CONFIGS[platform_id]
        
        from urllib.parse import urlencode
        
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(config["scopes"]),
            "state": state,
        }
        
        return f"{config['auth_url']}?{urlencode(params)}"
    
    @classmethod
    async def exchange_platform_code(
        cls, platform_id: str, code: str, redirect_uri: str
    ) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for platform access token."""
        if platform_id not in cls.PLATFORM_OAUTH_CONFIGS:
            return None
        
        client_id, client_secret = cls.get_platform_client_credentials(platform_id)
        if not client_id or not client_secret:
            return None
        
        config = cls.PLATFORM_OAUTH_CONFIGS[platform_id]
        
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
    async def get_platform_user_info(
        cls, platform_id: str, access_token: str
    ) -> Optional[Dict[str, Any]]:
        """Get user/account information from the social media platform."""
        endpoints = {
            "twitter": "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username",
            "facebook": "https://graph.facebook.com/me?fields=id,name,accounts{name,access_token,id}",
            "instagram": "https://graph.facebook.com/me/accounts?fields=instagram_business_account",
            "linkedin": "https://api.linkedin.com/v2/userinfo",
            "youtube": "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        }
        
        if platform_id not in endpoints:
            return None
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoints[platform_id], headers=headers)
            
            if response.status_code == 200:
                return response.json()
        
        return None
    
    @classmethod
    async def publish_to_twitter(
        cls, account: ConnectedAccount, content: str, media_urls: List[str] = None
    ) -> Dict[str, Any]:
        """Publish a tweet to Twitter."""
        url = "https://api.twitter.com/2/tweets"
        headers = {"Authorization": f"Bearer {account.access_token}"}
        
        payload = {"text": content}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                return {
                    "success": True,
                    "post_url": f"https://twitter.com/i/status/{data['data']['id']}",
                    "post_id": data["data"]["id"],
                }
            else:
                return {
                    "success": False,
                    "error": response.text,
                }
    
    @classmethod
    async def publish_to_facebook(
        cls, account: ConnectedAccount, content: str, media_urls: List[str] = None
    ) -> Dict[str, Any]:
        """Publish a post to Facebook."""
        page_id = account.page_id or account.platform_user_id
        url = f"https://graph.facebook.com/v18.0/{page_id}/feed"
        
        params = {
            "access_token": account.access_token,
            "message": content,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=params)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "post_url": f"https://facebook.com/{data['id']}",
                    "post_id": data["id"],
                }
            else:
                return {
                    "success": False,
                    "error": response.text,
                }
    
    @classmethod
    async def publish_to_linkedin(
        cls, account: ConnectedAccount, content: str, media_urls: List[str] = None
    ) -> Dict[str, Any]:
        """Publish a post to LinkedIn."""
        url = "https://api.linkedin.com/v2/ugcPosts"
        headers = {
            "Authorization": f"Bearer {account.access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }
        
        payload = {
            "author": f"urn:li:person:{account.platform_user_id}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": content},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                post_id = data.get("id", "").replace("urn:li:share:", "")
                return {
                    "success": True,
                    "post_url": f"https://linkedin.com/feed/update/urn:li:share:{post_id}",
                    "post_id": post_id,
                }
            else:
                return {
                    "success": False,
                    "error": response.text,
                }
    
    @classmethod
    async def publish_to_instagram(
        cls, account: ConnectedAccount, content: str, media_urls: List[str] = None
    ) -> Dict[str, Any]:
        """Publish a post to Instagram using the Graph API.
        
        Instagram requires media (image or video) for all posts.
        The process is:
        1. Create a media container with the image/video URL
        2. Publish the container
        """
        ig_user_id = account.page_id or account.platform_user_id
        access_token = account.access_token
        
        # Instagram requires at least one media item
        if not media_urls or len(media_urls) == 0:
            return {
                "success": False,
                "error": "Instagram requires at least one image or video to publish",
            }
        
        async with httpx.AsyncClient() as client:
            # For single image post
            if len(media_urls) == 1:
                # Step 1: Create media container
                container_url = f"https://graph.facebook.com/v18.0/{ig_user_id}/media"
                container_params = {
                    "access_token": access_token,
                    "image_url": media_urls[0],
                    "caption": content,
                }
                
                container_response = await client.post(container_url, data=container_params)
                
                if container_response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"Failed to create media container: {container_response.text}",
                    }
                
                container_data = container_response.json()
                creation_id = container_data.get("id")
                
                # Step 2: Publish the container
                publish_url = f"https://graph.facebook.com/v18.0/{ig_user_id}/media_publish"
                publish_params = {
                    "access_token": access_token,
                    "creation_id": creation_id,
                }
                
                publish_response = await client.post(publish_url, data=publish_params)
                
                if publish_response.status_code == 200:
                    data = publish_response.json()
                    media_id = data.get("id")
                    return {
                        "success": True,
                        "post_url": f"https://www.instagram.com/p/{media_id}/",
                        "post_id": media_id,
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to publish: {publish_response.text}",
                    }
            else:
                # For carousel (multiple images)
                # Step 1: Create containers for each image
                children_ids = []
                for image_url in media_urls[:10]:  # Instagram allows max 10 items
                    container_url = f"https://graph.facebook.com/v18.0/{ig_user_id}/media"
                    container_params = {
                        "access_token": access_token,
                        "image_url": image_url,
                        "is_carousel_item": "true",
                    }
                    
                    container_response = await client.post(container_url, data=container_params)
                    
                    if container_response.status_code == 200:
                        children_ids.append(container_response.json().get("id"))
                    else:
                        return {
                            "success": False,
                            "error": f"Failed to create carousel item: {container_response.text}",
                        }
                
                # Step 2: Create carousel container
                carousel_url = f"https://graph.facebook.com/v18.0/{ig_user_id}/media"
                carousel_params = {
                    "access_token": access_token,
                    "media_type": "CAROUSEL",
                    "caption": content,
                    "children": ",".join(children_ids),
                }
                
                carousel_response = await client.post(carousel_url, data=carousel_params)
                
                if carousel_response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"Failed to create carousel: {carousel_response.text}",
                    }
                
                creation_id = carousel_response.json().get("id")
                
                # Step 3: Publish the carousel
                publish_url = f"https://graph.facebook.com/v18.0/{ig_user_id}/media_publish"
                publish_params = {
                    "access_token": access_token,
                    "creation_id": creation_id,
                }
                
                publish_response = await client.post(publish_url, data=publish_params)
                
                if publish_response.status_code == 200:
                    data = publish_response.json()
                    media_id = data.get("id")
                    return {
                        "success": True,
                        "post_url": f"https://www.instagram.com/p/{media_id}/",
                        "post_id": media_id,
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to publish carousel: {publish_response.text}",
                    }
    
    @classmethod
    async def publish(
        cls, account: ConnectedAccount, content: str, media_urls: List[str] = None
    ) -> Dict[str, Any]:
        """Publish content to any supported platform."""
        publishers = {
            "twitter": cls.publish_to_twitter,
            "facebook": cls.publish_to_facebook,
            "linkedin": cls.publish_to_linkedin,
            "instagram": cls.publish_to_instagram,
        }
        
        publisher = publishers.get(account.platform_id)
        if publisher:
            return await publisher(account, content, media_urls)
        
        return {
            "success": False,
            "error": f"Unsupported platform: {account.platform_id}",
        }

