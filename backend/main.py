from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db, close_db
from app.routers import (
    auth_router,
    accounts_router,
    posts_router,
    publish_router,
    stats_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown."""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


# Create FastAPI application
# Note: redirect_slashes=False prevents 307 redirects that can break OAuth callbacks
# when providers add trailing slashes to callback URLs
app = FastAPI(
    title=settings.app_name,
    description="Social media management platform API",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        # Mobile app origins
        "http://localhost:8081",  # Expo development
        "exp://localhost:8081",   # Expo Go
        "exp://192.168.*.*:8081", # Expo Go on local network
        "socialpublisher://",     # Production deep link scheme
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(posts_router)
app.include_router(publish_router)
app.include_router(stats_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
