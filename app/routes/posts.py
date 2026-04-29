"""
Post Routes - Community Posts CRUD
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime

from ..models import Post, User, Comment
from ..database import get_db
from ..routes.auth import get_current_user

router = APIRouter(prefix="/api/posts", tags=["Posts"])

@router.get("/", response_model=List[dict])
async def list_posts(
    skip: int = 0,
    limit: int = 20,
    channel: Optional[str] = None,  # home, business, resource, tech, finance, beijing-suzhou, events
    kind: Optional[str] = None,     # HUMAN | AGENT — filter by author kind
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Post).filter(Post.is_public == True)

    if channel:
        query = query.filter(Post.channel == channel)

    if kind:
        query = query.filter(Post.author_kind == kind.upper())

    if search:
        query = query.filter(
            (Post.title.ilike(f"%{search}%")) |
            (Post.content.ilike(f"%{search}%"))
        )

    posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()

    return [{
        "id": str(post.id),
        "title": post.title,
        "content": post.content[:500],  # Truncate for list view
        "channel": post.channel,
        "author_id": str(post.author_id),
        "author_username": post.author.username if post.author else None,
        # Author-kind dimension (HUMAN by default for legacy rows)
        "author_kind": getattr(post, "author_kind", None) or "HUMAN",
        "agent_id": str(post.agent_id) if getattr(post, "agent_id", None) else None,
        "agent_name": post.agent.name if getattr(post, "agent", None) else None,
        "agent_icon": post.agent.icon if getattr(post, "agent", None) else None,
        "agent_org_name": (
            post.agent.organization.name
            if getattr(post, "agent", None) and post.agent.organization
            else None
        ),
        "likes": post.likes,
        "comments_count": len(post.comments),
        "views": post.views,
        "created_at": post.created_at.isoformat() if post.created_at else None
    } for post in posts]

@router.get("/{post_id}", response_model=dict)
async def get_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Increment view count
    post.views += 1
    db.commit()

    return {
        "id": str(post.id),
        "title": post.title,
        "content": post.content,
        "channel": post.channel,
        "author_id": str(post.author_id),
        "likes": post.likes,
        "comments_count": len(post.comments),
        "views": post.views,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "comments": [{
            "id": str(c.id),
            "user_id": str(c.user_id),
            "content": c.content,
            "created_at": c.created_at.isoformat() if c.created_at else None
        } for c in post.comments]
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_post(
    title: str,
    content: str,
    channel: str = "home",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_post = Post(
        id=str(uuid.uuid4()),
        title=title,
        content=content,
        channel=channel,
        author_id=current_user.id,
        likes=0,
        views=0,
        is_public=True
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return {
        "message": "Post created successfully",
        "post": {
            "id": str(new_post.id),
            "title": new_post.title,
            "channel": new_post.channel
        }
    }

@router.put("/{post_id}")
async def update_post(
    post_id: str,
    title: str = None,
    content: str = None,
    channel: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Only author can update
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if title: post.title = title
    if content: post.content = content
    if channel: post.channel = channel

    db.commit()
    db.refresh(post)

    return {"message": "Post updated successfully"}

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Only author can delete
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(post)
    db.commit()

    return {"message": "Post deleted successfully"}

@router.post("/{post_id}/like")
async def like_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.likes += 1
    db.commit()
    db.refresh(post)

    return {
        "message": "Post liked",
        "likes": post.likes
    }
