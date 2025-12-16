from typing import List
from fastapi import APIRouter, Depends
from datetime import datetime

from app.schemas.post import DashboardStats, Activity
from app.models.user import User
from app.models.post import Post, PublishResult
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics for the current user."""
    # Count posts
    total_posts = await Post.find(
        Post.user_id == str(current_user.id)
    ).count()
    
    # Count publish results by status
    all_results = await PublishResult.find(
        PublishResult.user_id == str(current_user.id)
    ).to_list()
    
    published_count = sum(1 for r in all_results if r.status == "published")
    failed_count = sum(1 for r in all_results if r.status == "failed")
    pending_count = sum(1 for r in all_results if r.status in ["pending", "in_progress"])
    
    total_results = len(all_results)
    success_rate = round((published_count / total_results) * 100) if total_results > 0 else 0
    
    return DashboardStats(
        totalPosts=total_posts,
        publishedCount=published_count,
        failedCount=failed_count,
        pendingCount=pending_count,
        successRate=success_rate,
    )


@router.get("/activity", response_model=List[Activity])
async def get_recent_activity(current_user: User = Depends(get_current_user)):
    """Get recent activity for the current user."""
    # Get recent publish results
    results = await PublishResult.find(
        PublishResult.user_id == str(current_user.id)
    ).sort(-PublishResult.created_at).limit(10).to_list()
    
    activities = []
    for result in results:
        activity_type = "publish_success" if result.status == "published" else "publish_failed"
        message = (
            f"Post published to {result.platform_id}"
            if result.status == "published"
            else f"Failed to publish to {result.platform_id}"
        )
        
        activities.append(Activity(
            id=str(result.id),
            type=activity_type,
            platformId=result.platform_id,
            message=message,
            timestamp=result.updated_at.isoformat() if result.updated_at else result.created_at.isoformat(),
        ))
    
    return activities
