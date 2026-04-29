"""
Agent Routes - CRUD operations for AI Agents
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import hashlib
import os
import secrets
import time
import uuid

from ..models import Agent, Organization, OrganizationMembership, User, MemberRole
from ..database import get_db
from ..routes.auth import get_current_user

router = APIRouter(prefix="/api/agents", tags=["Agents"])

AGENT_REGISTRATION_CODE = os.getenv("AGENT_REGISTRATION_CODE")
if not AGENT_REGISTRATION_CODE:
    raise RuntimeError(
        "AGENT_REGISTRATION_CODE env var must be set. "
        "For local dev: export AGENT_REGISTRATION_CODE=dev-only-do-not-share"
    )
AGENT_CHALLENGE_TTL_SECONDS = 2 * 60
AGENT_CHALLENGE_DIFFICULTY = int(os.getenv("AGENT_CHALLENGE_DIFFICULTY", "4"))

_agent_challenges: dict[str, dict] = {}


def _agent_to_dict(agent: Agent) -> dict:
    """Serialize an Agent as a non-human identity for the frontend."""
    return {
        "id": str(agent.id),
        "name": agent.name,
        "description": agent.description,
        "category": agent.category,
        "tags": agent.tags or [],
        "icon": agent.icon,
        "api_endpoint": agent.api_endpoint,
        "is_public": agent.is_public,
        "star_count": agent.star_count,
        "usage_count": agent.usage_count,
        "organization_id": agent.organization_id,
        "organization_name": agent.organization.name if agent.organization else None,
        "owner_id": agent.owner_id,
        "identity_type": "AGENT",
        "is_human": False,
    }


def _split_tags(tags: Optional[str]) -> list[str]:
    if not tags:
        return []
    return [t.strip() for t in tags.split(",") if t.strip()]


def _require_agent_code(agent_code: str) -> None:
    if not agent_code or not secrets.compare_digest(agent_code, AGENT_REGISTRATION_CODE):
        raise HTTPException(status_code=403, detail="Invalid agent registration code")


def _challenge_digest(challenge_id: str, agent_code: str, nonce: str, salt: str) -> str:
    raw = f"{challenge_id}:{agent_code}:{nonce}:{salt}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _verify_agent_challenge(challenge_id: str, agent_code: str, nonce: str) -> None:
    challenge = _agent_challenges.get(challenge_id)
    if not challenge:
        raise HTTPException(status_code=400, detail="Agent challenge not found or expired")
    if challenge.get("used"):
        raise HTTPException(status_code=400, detail="Agent challenge already used")
    if time.time() > challenge["expires_at"]:
        _agent_challenges.pop(challenge_id, None)
        raise HTTPException(status_code=400, detail="Agent challenge expired")

    digest = _challenge_digest(challenge_id, agent_code, nonce or "", challenge["salt"])
    if not digest.startswith("0" * challenge["difficulty"]):
        raise HTTPException(status_code=400, detail="Invalid agent challenge result")
    challenge["used"] = True


@router.post("/registration-challenge")
async def create_agent_registration_challenge(agent_code: str):
    """
    Issue a short-lived proof-of-work challenge for Agent registration.

    The caller must know the registration code and then quickly compute a nonce
    whose SHA-256 digest starts with N zeroes. This does not make the identity
    autonomous by itself; it raises the cost of scripted/manual spoofing and is
    combined with the logged-in human/organization responsibility check below.
    """
    _require_agent_code(agent_code)
    challenge_id = str(uuid.uuid4())
    salt = secrets.token_hex(12)
    _agent_challenges[challenge_id] = {
        "salt": salt,
        "difficulty": AGENT_CHALLENGE_DIFFICULTY,
        "expires_at": time.time() + AGENT_CHALLENGE_TTL_SECONDS,
        "used": False,
    }
    return {
        "challenge_id": challenge_id,
        "salt": salt,
        "difficulty": AGENT_CHALLENGE_DIFFICULTY,
        "expires_in": AGENT_CHALLENGE_TTL_SECONDS,
        "algorithm": "sha256(challenge_id + ':' + agent_code + ':' + nonce + ':' + salt)",
    }


@router.get("/", response_model=List[dict])
async def list_agents(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Agent)

    if category:
        query = query.filter(Agent.category == category)

    if search:
        query = query.filter(
            (Agent.name.ilike(f"%{search}%")) |
            (Agent.description.ilike(f"%{search}%"))
        )

    agents = query.offset(skip).limit(limit).all()

    return [_agent_to_dict(agent) for agent in agents]

@router.get("/{agent_id}", response_model=dict)
async def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return _agent_to_dict(agent)


@router.post("/auto-register", status_code=status.HTTP_201_CREATED)
async def auto_register_agent(
    name: str,
    description: str = "",
    category: str = "自动注册智能体",
    icon: str = "🤖",
    tags: Optional[str] = None,
    api_endpoint: Optional[str] = None,
    organization_id: Optional[str] = None,
    is_public: bool = True,
    agent_code: str = "",
    challenge_id: str = "",
    nonce: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    自动注册一个非人类 Agent 身份。

    这个入口不会创建 User, 也不会签发人类登录 token。它只创建/复用
    agents 表里的智能体身份, 并在返回值里明确标记 identity_type=AGENT。

    为防止人类匿名伪装成智能体, 注册必须由已登录的人类账号发起:
      - 个人智能体绑定 owner_id = current_user.id
      - 组织智能体必须由该组织 OWNER / ADMIN 发起
      - 调用方必须持有 agent registration code 并完成短时计算挑战
    """
    _require_agent_code(agent_code)
    _verify_agent_challenge(challenge_id, agent_code, nonce)

    org = None
    if organization_id:
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        membership = (
            db.query(OrganizationMembership)
            .filter(
                OrganizationMembership.organization_id == organization_id,
                OrganizationMembership.user_id == current_user.id,
            )
            .first()
        )
        if not membership or membership.role not in (MemberRole.OWNER, MemberRole.ADMIN):
            raise HTTPException(
                status_code=403,
                detail="Only organization owners or admins can register organization agents",
            )

    existing = None
    if api_endpoint:
        existing = db.query(Agent).filter(Agent.api_endpoint == api_endpoint).first()
        if existing and organization_id and existing.organization_id != organization_id:
            raise HTTPException(status_code=409, detail="API endpoint already registered")
        if existing and not organization_id and existing.owner_id != current_user.id:
            raise HTTPException(status_code=409, detail="API endpoint already registered")
    if not existing:
        if organization_id:
            query = db.query(Agent).filter(
                Agent.name == name,
                Agent.organization_id == organization_id,
            )
        else:
            query = db.query(Agent).filter(
                Agent.name == name,
                Agent.owner_id == current_user.id,
                Agent.organization_id.is_(None),
            )
        existing = query.first()

    if existing:
        return {
            "message": "Agent already registered",
            "created": False,
            "agent": _agent_to_dict(existing),
        }

    agent = Agent(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        category=category,
        icon=icon or "🤖",
        tags=_split_tags(tags),
        api_endpoint=api_endpoint,
        organization_id=organization_id,
        owner_id=None if organization_id else current_user.id,
        is_public=is_public,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)

    return {
        "message": "Agent registered successfully",
        "created": True,
        "agent": _agent_to_dict(agent),
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_agent(
    name: str,
    description: str,
    category: str,
    tags: List[str] = [],
    api_endpoint: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_agent = Agent(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        category=category,
        tags=tags,
        api_endpoint=api_endpoint,
        owner_id=current_user.id
    )
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)

    return {
        "message": "Agent created successfully",
        "agent": _agent_to_dict(new_agent)
    }

@router.put("/{agent_id}")
async def update_agent(
    agent_id: str,
    name: str = None,
    description: str = None,
    category: str = None,
    tags: List[str] = None,
    api_endpoint: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Only owner can update
    if agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if name: agent.name = name
    if description: agent.description = description
    if category: agent.category = category
    if tags: agent.tags = tags
    if api_endpoint: agent.api_endpoint = api_endpoint

    db.commit()
    db.refresh(agent)

    return {"message": "Agent updated successfully"}

@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Only owner can delete
    if agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(agent)
    db.commit()

    return {"message": "Agent deleted successfully"}
