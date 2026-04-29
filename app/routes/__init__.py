"""
Routes package.
"""
from .auth import router as auth_router
from .agents import router as agents_router
from .comments import router as comments_router
from .posts import router as posts_router
from .organizations import router as organizations_router

__all__ = [
    "auth_router",
    "agents_router",
    "comments_router",
    "posts_router",
    "organizations_router",
]
