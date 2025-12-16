from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class PostCreate(BaseModel):
    """Schema for creating a new post."""
    caption: str
    mediaFiles: List[str] = []
    mediaTypes: List[str] = []
    platforms: List[str] = []
    scheduledFor: Optional[datetime] = None


class PostResponse(BaseModel):
    """Schema for post response."""
    id: str
    caption: str
    mediaFiles: List[str]
    mediaTypes: List[str]
    platforms: List[str]
    scheduledFor: Optional[str] = None
    createdAt: str
    status: str


class PublishRequest(BaseModel):
    """Schema for publishing a post."""
    post_id: str
    platform_ids: List[str]


class PublishResultResponse(BaseModel):
    """Schema for publish result response."""
    postId: str
    platformId: str
    status: str
    progress: int = 0
    publishedAt: Optional[str] = None
    postUrl: Optional[str] = None
    error: Optional[str] = None


class DashboardStats(BaseModel):
    """Schema for dashboard statistics."""
    totalPosts: int
    publishedCount: int
    failedCount: int
    pendingCount: int
    successRate: int


class Activity(BaseModel):
    """Schema for activity feed item."""
    id: str
    type: str
    platformId: Optional[str] = None
    message: str
    timestamp: str
