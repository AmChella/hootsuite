from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.post import PostCreate, PostResponse
from app.models.user import User
from app.models.post import Post
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=List[PostResponse])
async def get_posts(current_user: User = Depends(get_current_user)):
    """Get all posts for the current user."""
    posts = await Post.find(
        Post.user_id == str(current_user.id)
    ).sort(-Post.created_at).to_list()
    
    return [PostResponse(**post.to_response()) for post in posts]


@router.post("", response_model=PostResponse)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new post."""
    post = Post(
        user_id=str(current_user.id),
        caption=post_data.caption,
        media_files=post_data.mediaFiles,
        media_types=post_data.mediaTypes,
        platforms=post_data.platforms,
        scheduled_for=post_data.scheduledFor,
        status="draft" if not post_data.platforms else "scheduled" if post_data.scheduledFor else "publishing",
    )
    await post.insert()
    
    return PostResponse(**post.to_response())


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific post."""
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
    
    return PostResponse(**post.to_response())


@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a post."""
    post = await Post.get(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    await post.delete()
    
    return {"message": "Post deleted successfully"}
