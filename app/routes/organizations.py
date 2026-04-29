"""
Organization routes — 总商会 / 商会 / 企业 的 CRUD 与层级查询.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Organization, OrganizationMembership, Agent, User,
    OrgType, MemberRole,
)
from ..routes.auth import get_current_user


router = APIRouter(prefix="/api/organizations", tags=["Organizations"])


def _org_to_dict(org: Organization) -> dict:
    return {
        "id": org.id,
        "name": org.name,
        "short_name": org.short_name,
        "type": org.type.value if org.type else None,
        "parent_id": org.parent_id,
        "industry": org.industry,
        "region": org.region,
        "description": org.description,
        "logo_url": org.logo_url,
        "is_verified": org.is_verified,
        "member_count": len(org.memberships),
        "agent_count": len(org.agents),
        "child_count": len(org.children),
    }


@router.get("/", response_model=List[dict])
async def list_organizations(
    skip: int = 0,
    limit: int = 50,
    type: Optional[str] = None,
    parent_id: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """列出组织. 可按类型 / 父组织 / 关键字筛选."""
    query = db.query(Organization)

    if type:
        try:
            query = query.filter(Organization.type == OrgType(type))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Unknown org type: {type}")

    if parent_id is not None:
        # 显式传 "root" 查顶层 (parent_id is None)
        if parent_id == "root":
            query = query.filter(Organization.parent_id.is_(None))
        else:
            query = query.filter(Organization.parent_id == parent_id)

    if search:
        query = query.filter(Organization.name.ilike(f"%{search}%"))

    orgs = query.offset(skip).limit(limit).all()
    return [_org_to_dict(o) for o in orgs]


@router.get("/tree", response_model=List[dict])
async def get_org_tree(db: Session = Depends(get_db)):
    """
    返回整棵组织树 —— 从 GRAND_CHAMBER 开始, 递归嵌入 children.
    小规模数据直接内存递归, 后面数据量大可换 WITH RECURSIVE CTE.
    """
    all_orgs = db.query(Organization).all()
    by_parent: dict = {}
    for o in all_orgs:
        by_parent.setdefault(o.parent_id, []).append(o)

    def build(node: Organization) -> dict:
        d = _org_to_dict(node)
        d["children"] = [build(c) for c in by_parent.get(node.id, [])]
        return d

    roots = by_parent.get(None, [])
    return [build(r) for r in roots]


@router.get("/{org_id}", response_model=dict)
async def get_organization(org_id: str, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return _org_to_dict(org)


@router.get("/{org_id}/members", response_model=List[dict])
async def list_members(
    org_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    memberships = (
        db.query(OrganizationMembership)
        .filter(OrganizationMembership.organization_id == org_id)
        .offset(skip).limit(limit).all()
    )
    return [
        {
            "user_id": m.user_id,
            "username": m.user.username if m.user else None,
            "avatar_url": m.user.avatar_url if m.user else None,
            "role": m.role.value,
            "title": m.title,
            "joined_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in memberships
    ]


@router.get("/{org_id}/agents", response_model=List[dict])
async def list_org_agents(org_id: str, db: Session = Depends(get_db)):
    agents = db.query(Agent).filter(Agent.organization_id == org_id).all()
    return [
        {
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "category": a.category,
            "icon": a.icon,
            "tags": a.tags or [],
            "star_count": a.star_count,
            "usage_count": a.usage_count,
        }
        for a in agents
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_organization(
    name: str,
    type: str,
    parent_id: Optional[str] = None,
    short_name: Optional[str] = None,
    industry: Optional[str] = None,
    region: Optional[str] = None,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    创建组织. 校验:
      - type 必须是合法枚举
      - 层级规则: GRAND_CHAMBER 顶层 (parent=None), CHAMBER 父必须是 GRAND_CHAMBER,
        ENTERPRISE 父必须是 CHAMBER.
      - 创建者自动成为 OWNER 成员.
    """
    try:
        org_type = OrgType(type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown org type: {type}")

    parent = None
    if parent_id:
        parent = db.query(Organization).filter(Organization.id == parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent organization not found")

    # Hierarchy rules
    if org_type is OrgType.GRAND_CHAMBER and parent is not None:
        raise HTTPException(status_code=400, detail="GRAND_CHAMBER 不能有 parent")
    if org_type is OrgType.CHAMBER and (parent is None or parent.type is not OrgType.GRAND_CHAMBER):
        raise HTTPException(status_code=400, detail="CHAMBER 的 parent 必须是 GRAND_CHAMBER")
    if org_type is OrgType.ENTERPRISE and (parent is None or parent.type is not OrgType.CHAMBER):
        raise HTTPException(status_code=400, detail="ENTERPRISE 的 parent 必须是 CHAMBER")

    org = Organization(
        name=name,
        short_name=short_name,
        type=org_type,
        parent_id=parent_id,
        industry=industry,
        region=region,
        description=description,
    )
    db.add(org)
    db.flush()  # populate org.id

    # 创建者 = OWNER
    db.add(OrganizationMembership(
        user_id=current_user.id,
        organization_id=org.id,
        role=MemberRole.OWNER,
    ))
    db.commit()
    db.refresh(org)
    return _org_to_dict(org)


@router.post("/{org_id}/join")
async def join_organization(
    org_id: str,
    role: str = "MEMBER",
    title: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    try:
        member_role = MemberRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown role: {role}")

    existing = (
        db.query(OrganizationMembership)
        .filter(
            OrganizationMembership.user_id == current_user.id,
            OrganizationMembership.organization_id == org_id,
        ).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")

    m = OrganizationMembership(
        user_id=current_user.id,
        organization_id=org_id,
        role=member_role,
        title=title,
    )
    db.add(m)
    db.commit()
    return {"message": "Joined", "role": member_role.value}
