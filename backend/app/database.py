from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from typing import Optional

from app.config import get_settings
from app.models.user import User
from app.models.account import ConnectedAccount
from app.models.post import Post, PublishResult

settings = get_settings()

# Global database client
_client: Optional[AsyncIOMotorClient] = None


async def init_db():
    """Initialize MongoDB connection and Beanie ODM."""
    global _client
    
    _client = AsyncIOMotorClient(settings.mongodb_url)
    
    await init_beanie(
        database=_client[settings.mongodb_db_name],
        document_models=[
            User,
            ConnectedAccount,
            Post,
            PublishResult,
        ]
    )


async def close_db():
    """Close MongoDB connection."""
    global _client
    if _client:
        _client.close()


def get_database():
    """Get database instance for dependency injection."""
    return _client[settings.mongodb_db_name]
