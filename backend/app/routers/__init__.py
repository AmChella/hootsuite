from app.routers.auth import router as auth_router
from app.routers.accounts import router as accounts_router
from app.routers.posts import router as posts_router
from app.routers.publish import router as publish_router
from app.routers.stats import router as stats_router

__all__ = [
    "auth_router",
    "accounts_router", 
    "posts_router",
    "publish_router",
    "stats_router",
]
