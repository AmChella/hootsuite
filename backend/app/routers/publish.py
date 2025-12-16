from typing import List
from datetime import datetime
import asyncio
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks

from app.schemas.post import PublishRequest, PublishResultResponse
from app.models.user import User
from app.models.post import Post, PublishResult
from app.models.account import ConnectedAccount
from app.services.auth_service import get_current_user
from app.services.platform_service import PlatformService

router = APIRouter(prefix="/publish", tags=["Publishing"])


@router.post("", response_model=List[PublishResultResponse])
async def publish_post(
    request: PublishRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Publish a post to selected platforms."""
    # Get the post
    post = await Post.get(request.post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to publish this post"
        )
    
    # Create publish results for each platform
    results = []
    for platform_id in request.platform_ids:
        # Check if user has this platform connected
        account = await ConnectedAccount.find_one(
            ConnectedAccount.user_id == str(current_user.id),
            ConnectedAccount.platform_id == platform_id,
            ConnectedAccount.is_active == True
        )
        
        if not account:
            result = PublishResult(
                post_id=str(post.id),
                user_id=str(current_user.id),
                platform_id=platform_id,
                status="failed",
                error=f"No active {platform_id} account connected"
            )
        else:
            result = PublishResult(
                post_id=str(post.id),
                user_id=str(current_user.id),
                platform_id=platform_id,
                status="pending"
            )
        
        await result.insert()
        results.append(result)
    
    # Update post status
    post.status = "publishing"
    await post.save()
    
    # Start background publishing
    background_tasks.add_task(
        publish_to_platforms,
        str(post.id),
        str(current_user.id),
        request.platform_ids
    )
    
    return [PublishResultResponse(**r.to_response()) for r in results]


async def publish_to_platforms(post_id: str, user_id: str, platform_ids: List[str]):
    """Background task to publish to all platforms."""
    post = await Post.get(post_id)
    if not post:
        return
    
    all_success = True
    any_success = False
    
    for platform_id in platform_ids:
        # Get the publish result
        result = await PublishResult.find_one(
            PublishResult.post_id == post_id,
            PublishResult.platform_id == platform_id
        )
        
        if not result or result.status == "failed":
            continue
        
        # Update to in_progress
        result.status = "in_progress"
        result.progress = 10
        await result.save()
        
        # Get the account
        account = await ConnectedAccount.find_one(
            ConnectedAccount.user_id == user_id,
            ConnectedAccount.platform_id == platform_id,
            ConnectedAccount.is_active == True
        )
        
        if not account:
            result.status = "failed"
            result.error = f"No active {platform_id} account"
            await result.save()
            all_success = False
            continue
        
        # Simulate progress
        for progress in [30, 50, 70, 90]:
            result.progress = progress
            await result.save()
            await asyncio.sleep(0.5)
        
        # Publish to platform
        try:
            publish_result = await PlatformService.publish(
                account, post.caption, post.media_files
            )
            
            if publish_result["success"]:
                result.status = "published"
                result.published_at = datetime.utcnow()
                result.post_url = publish_result.get("post_url")
                result.progress = 100
                any_success = True
            else:
                result.status = "failed"
                result.error = publish_result.get("error", "Unknown error")
                all_success = False
        except Exception as e:
            result.status = "failed"
            result.error = str(e)
            all_success = False
        
        await result.save()
    
    # Update post status
    if all_success:
        post.status = "completed"
    elif any_success:
        post.status = "completed"  # Partial success
    else:
        post.status = "failed"
    await post.save()


@router.get("/{post_id}", response_model=List[PublishResultResponse])
async def get_publish_results(
    post_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get publish results for a post."""
    post = await Post.get(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this post"
        )
    
    results = await PublishResult.find(
        PublishResult.post_id == post_id
    ).to_list()
    
    return [PublishResultResponse(**r.to_response()) for r in results]


@router.post("/{post_id}/retry/{platform_id}", response_model=PublishResultResponse)
async def retry_publish(
    post_id: str,
    platform_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Retry publishing a failed post to a platform."""
    post = await Post.get(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to retry this post"
        )
    
    result = await PublishResult.find_one(
        PublishResult.post_id == post_id,
        PublishResult.platform_id == platform_id
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publish result not found"
        )
    
    # Reset result for retry
    result.status = "pending"
    result.error = None
    result.progress = 0
    await result.save()
    
    # Start background retry
    background_tasks.add_task(
        publish_to_platforms,
        post_id,
        str(current_user.id),
        [platform_id]
    )
    
    return PublishResultResponse(**result.to_response())
