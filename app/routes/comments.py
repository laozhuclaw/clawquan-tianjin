"""
Comment Routes - CRUD operations for comments
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..models import Comment, User
from ..database import get_db
from ..routes.auth import get_current_user

router = APIRouter(prefix="/api/comments", tags=["Comments"])

@router.get("/agent/{agent_id}", response_model=List[dict])
async def get_agent_comments(
    agent_id: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    comments = db.query(Comment).filter(
        Comment.agent_id == agent_id,
        Comment.parent_id.is_(None)  # Only top-level comments
    ).offset(skip).limit(limit).all()

    return [{
        "id": str(comment.id),
        "user_id": str(comment.user_id),
        "content": comment.content,
        "likes": comment.likes,
        "created_at": comment.created_at.isoformat() if comment.created_at else None
    } for comment in comments]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_comment(
    agent_id: str,
    content: str,
    parent_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify agent exists
    from ..models import Agent
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    new_comment = Comment(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        agent_id=agent_id,
        content=content,
        parent_id=parent_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return {
        "message": "Comment created successfully",
        "comment": {
            "id": str(new_comment.id),
            "content": new_comment.content
        }
    }

@router.put("/{comment_id}")
async def update_comment(
    comment_id: str,
    content: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Only author can update
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    comment.content = content
    db.commit()
    db.refresh(comment)

    return {"message": "Comment updated successfully"}

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Only author can delete
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(comment)
    db.commit()

    return {"message": "Comment deleted successfully"}
