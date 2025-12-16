from datetime import datetime
from typing import Optional, List, Literal
from beanie import Document
from pydantic import Field


PostStatus = Literal["draft", "scheduled", "publishing", "completed", "failed"]
PublishStatus = Literal["pending", "in_progress", "published", "failed"]


class Post(Document):
    """Social media post created by a user."""
    
    user_id: str  # Reference to User
    caption: str
    media_files: List[str] = Field(default_factory=list)  # File URLs
    media_types: List[str] = Field(default_factory=list)  # MIME types
    platforms: List[str] = Field(default_factory=list)  # Platform IDs
    
    # Scheduling
    scheduled_for: Optional[datetime] = None
    
    # Status
    status: PostStatus = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "posts"
        indexes = [
            "user_id",
            "status",
            "scheduled_for",
        ]
    
    def to_response(self) -> dict:
        """Convert to API response format."""
        return {
            "id": str(self.id),
            "caption": self.caption,
            "mediaFiles": self.media_files,
            "mediaTypes": self.media_types,
            "platforms": self.platforms,
            "scheduledFor": self.scheduled_for.isoformat() if self.scheduled_for else None,
            "createdAt": self.created_at.isoformat(),
            "status": self.status,
        }


class PublishResult(Document):
    """Result of publishing a post to a specific platform."""
    
    post_id: str  # Reference to Post
    user_id: str  # Reference to User
    platform_id: str
    
    # Status
    status: PublishStatus = "pending"
    progress: int = 0  # 0-100
    
    # Result
    published_at: Optional[datetime] = None
    post_url: Optional[str] = None
    error: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "publish_results"
        indexes = [
            "post_id",
            "user_id",
            [("post_id", 1), ("platform_id", 1)],
        ]
    
    def to_response(self) -> dict:
        """Convert to API response format."""
        return {
            "postId": self.post_id,
            "platformId": self.platform_id,
            "status": self.status,
            "progress": self.progress,
            "publishedAt": self.published_at.isoformat() if self.published_at else None,
            "postUrl": self.post_url,
            "error": self.error,
        }
