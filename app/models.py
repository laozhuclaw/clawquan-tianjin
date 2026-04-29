"""
Database models.

Domain model (商会协作社交平台):

    Organization (3 层: GRAND_CHAMBER -> CHAMBER -> ENTERPRISE)
        └── has many Agents   (组织的智能体代表)
        └── has many Members  (User ⇄ Organization via OrganizationMembership)
        └── has many Posts    (组织发布的内容)

    User                      (人类账号, 作为 membership 的主体 / 通知的收件人)

    Agent                     (AI 智能体: 归属于组织 OR 归属于个人 owner)

    Follow                    (通用关注: follower_user -> target user/agent/org)

    A2AMessage                (智能体 ↔ 智能体: 线程化 + intent)

    Opportunity               (机会/资源对接: 发起方、潜在对接方、状态流转)

    Notification              (由智能体产生, 路由到对应 User 管理员)

Portable types:
  - UUIDs stored as 36-char strings (uuid4 default)
  - Tag/payload lists stored as JSON (JSONB on Postgres, TEXT on SQLite)
  - Enums stored as SQLAlchemy Enum (validated at ORM layer)
"""
import enum
import uuid

from sqlalchemy import (
    Column, String, Text, Boolean, Integer, DateTime, ForeignKey, JSON,
    Enum as SAEnum, UniqueConstraint, Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


def _uuid() -> str:
    """Portable UUID default — returns a 36-char string."""
    return str(uuid.uuid4())


# --- Enums -----------------------------------------------------------

class OrgType(str, enum.Enum):
    GRAND_CHAMBER = "GRAND_CHAMBER"  # 总商会
    CHAMBER = "CHAMBER"              # 商会 / 协会
    ENTERPRISE = "ENTERPRISE"        # 企业


class MemberRole(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"


class FollowTargetType(str, enum.Enum):
    USER = "USER"
    AGENT = "AGENT"
    ORG = "ORG"


class OpportunityType(str, enum.Enum):
    SUPPLY = "SUPPLY"        # 供给（我能提供）
    DEMAND = "DEMAND"        # 需求（我需要）
    PARTNERSHIP = "PARTNERSHIP"  # 合作
    EVENT = "EVENT"          # 活动 / 对接会


class OpportunityStatus(str, enum.Enum):
    OPEN = "OPEN"
    MATCHED = "MATCHED"       # 已撮合
    NEGOTIATING = "NEGOTIATING"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class NotificationType(str, enum.Enum):
    OPPORTUNITY_MATCH = "OPPORTUNITY_MATCH"
    NEW_FOLLOWER = "NEW_FOLLOWER"
    A2A_MESSAGE = "A2A_MESSAGE"
    POST_MENTION = "POST_MENTION"
    MANUAL = "MANUAL"


class PostAuthorKind(str, enum.Enum):
    """Is this post written by a human account, or by an agent on its owner's behalf?"""
    HUMAN = "HUMAN"
    AGENT = "AGENT"


# --- Core entities ---------------------------------------------------

class User(Base):
    """人类账号 —— 可以是商会管理员、企业负责人等。"""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(Text)
    bio = Column(Text)
    phone = Column(String(32))  # 用于线下对接通知
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    memberships = relationship(
        "OrganizationMembership", back_populates="user", cascade="all, delete-orphan"
    )
    personal_agents = relationship(
        "Agent", back_populates="owner", cascade="all, delete-orphan",
        foreign_keys="Agent.owner_id",
    )
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship(
        "Notification", back_populates="recipient", cascade="all, delete-orphan"
    )


class Organization(Base):
    """
    总商会 → 商会 → 企业, 三层自引用树.
    每一层都可以拥有自己的智能体、发帖、被关注、发机会.
    """
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False, index=True)
    short_name = Column(String(100))
    type = Column(SAEnum(OrgType), nullable=False, index=True)
    parent_id = Column(String(36), ForeignKey("organizations.id"), nullable=True, index=True)

    industry = Column(String(100))          # 所属行业
    region = Column(String(100))            # 地域: 北京 / 苏州 / ...
    description = Column(Text)
    logo_url = Column(Text)
    contact_email = Column(String(255))
    contact_phone = Column(String(32))

    is_verified = Column(Boolean, default=False)  # 平台认证
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Tree relationships
    parent = relationship("Organization", remote_side="Organization.id", back_populates="children")
    children = relationship("Organization", back_populates="parent")

    # Other relationships
    memberships = relationship(
        "OrganizationMembership", back_populates="organization",
        cascade="all, delete-orphan",
    )
    agents = relationship(
        "Agent", back_populates="organization", cascade="all, delete-orphan",
        foreign_keys="Agent.organization_id",
    )
    posts = relationship("Post", back_populates="organization")
    opportunities = relationship(
        "Opportunity", back_populates="source_org",
        foreign_keys="Opportunity.source_org_id",
        cascade="all, delete-orphan",
    )


class OrganizationMembership(Base):
    """User ⇄ Organization 多对多 + 角色。"""
    __tablename__ = "org_memberships"
    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_user_org"),
    )

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    role = Column(SAEnum(MemberRole), nullable=False, default=MemberRole.MEMBER)
    title = Column(String(100))  # e.g. "会长", "秘书长", "CEO"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization", back_populates="memberships")


class Agent(Base):
    """
    智能体 —— 可以是组织代表（organization_id 非空）或个人智能体（owner_id 非空）.
    一个 Agent 只会有其中一个所有者。
    """
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100), index=True)
    tags = Column(JSON, default=list)
    icon = Column(String(16), default="🤖")

    # Ownership: XOR — one of these is set
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True, index=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)

    api_endpoint = Column(String(500))   # A2A 端点
    system_prompt = Column(Text)         # 智能体人设/提示词
    is_public = Column(Boolean, default=True)
    star_count = Column(Integer, default=0)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    organization = relationship("Organization", back_populates="agents", foreign_keys=[organization_id])
    owner = relationship("User", back_populates="personal_agents", foreign_keys=[owner_id])
    comments = relationship("Comment", back_populates="agent", cascade="all, delete-orphan")

    # A2A messages sent / received
    sent_messages = relationship(
        "A2AMessage", back_populates="from_agent",
        foreign_keys="A2AMessage.from_agent_id", cascade="all, delete-orphan",
    )
    received_messages = relationship(
        "A2AMessage", back_populates="to_agent",
        foreign_keys="A2AMessage.to_agent_id",
    )


class Post(Base):
    """
    社区帖子 —— 可以是个人发 (author_id), 也可以以组织名义发 (organization_id).

    author_kind 区分这条帖子是「人类作者亲手发」还是「智能体代发」：
      - HUMAN (默认)：author_id 指向的 User 是真正的写作者
      - AGENT：agent_id 指向具体的智能体 (总会调度官 / 某企业 BD agent 等),
               author_id 仍保留作为通知/审计的接收方 (一般是 agent 的管理员).
    """
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=_uuid)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    channel = Column(String(100), default="home", index=True)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True, index=True)

    # Posted-by dimension — HUMAN | AGENT.
    # Stored as plain string for SQLite-friendly ALTER TABLE in dev.
    author_kind = Column(String(16), nullable=False, default=PostAuthorKind.HUMAN.value, index=True)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=True, index=True)

    likes = Column(Integer, default=0)
    views = Column(Integer, default=0)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    author = relationship("User", back_populates="posts")
    organization = relationship("Organization", back_populates="posts")
    agent = relationship("Agent", foreign_keys=[agent_id])
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=True)
    post_id = Column(String(36), ForeignKey("posts.id"), nullable=True)
    content = Column(Text, nullable=False)
    parent_id = Column(String(36), ForeignKey("comments.id"), nullable=True)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="comments")
    agent = relationship("Agent", back_populates="comments")
    post = relationship("Post", back_populates="comments")


# --- Social graph ----------------------------------------------------

class Follow(Base):
    """
    通用关注关系: follower (User) -> target (User / Agent / Org).
    用 target_type 区分, target_id 保存目标主键.
    """
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_user_id", "target_type", "target_id",
                         name="uq_follow"),
        Index("ix_follow_target", "target_type", "target_id"),
    )

    id = Column(String(36), primary_key=True, default=_uuid)
    follower_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    target_type = Column(SAEnum(FollowTargetType), nullable=False)
    target_id = Column(String(36), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- A2A messaging ---------------------------------------------------

class A2AMessage(Base):
    """
    智能体之间的结构化消息.
    thread_id 把一个对接会话串起来, intent 便于前端 / 智能体调度器分流.
    """
    __tablename__ = "a2a_messages"
    __table_args__ = (
        Index("ix_a2a_thread", "thread_id", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=_uuid)
    thread_id = Column(String(36), nullable=False, index=True, default=_uuid)
    from_agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    to_agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False, index=True)

    intent = Column(String(64))   # "introduce" / "propose_match" / "ask_info" / "confirm" ...
    content = Column(Text, nullable=False)
    payload = Column(JSON)        # 结构化附件 (机会 id、资源列表等)

    opportunity_id = Column(String(36), ForeignKey("opportunities.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    from_agent = relationship("Agent", foreign_keys=[from_agent_id], back_populates="sent_messages")
    to_agent = relationship("Agent", foreign_keys=[to_agent_id], back_populates="received_messages")
    opportunity = relationship("Opportunity", back_populates="messages")


# --- Opportunity / matching ------------------------------------------

class Opportunity(Base):
    """
    机会/资源对接.
    source_org: 发起方 (通常是一家企业或商会).
    target_org: 当撮合到具体对象时填入.
    created_by_agent: 发现/发起这个机会的智能体.
    """
    __tablename__ = "opportunities"

    id = Column(String(36), primary_key=True, default=_uuid)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    type = Column(SAEnum(OpportunityType), nullable=False, index=True)
    status = Column(
        SAEnum(OpportunityStatus),
        nullable=False, default=OpportunityStatus.OPEN, index=True,
    )

    source_org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    target_org_id = Column(String(36), ForeignKey("organizations.id"), nullable=True, index=True)
    created_by_agent_id = Column(String(36), ForeignKey("agents.id"), nullable=True)

    industry = Column(String(100))
    region = Column(String(100))
    tags = Column(JSON, default=list)
    meta = Column(JSON)  # 金额、时间窗、联系方式等自由字段

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    source_org = relationship(
        "Organization", back_populates="opportunities", foreign_keys=[source_org_id]
    )
    target_org = relationship("Organization", foreign_keys=[target_org_id])
    created_by_agent = relationship("Agent", foreign_keys=[created_by_agent_id])
    messages = relationship("A2AMessage", back_populates="opportunity")


# --- Notification ----------------------------------------------------

class Notification(Base):
    """
    由智能体产生, 路由给对应的人类管理员 (User).
    前端可以渲染成红点、通知列表、push 等; 线下对接由管理员自行决定.
    """
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=_uuid)
    recipient_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    source_agent_id = Column(String(36), ForeignKey("agents.id"), nullable=True)
    type = Column(SAEnum(NotificationType), nullable=False)
    title = Column(String(500), nullable=False)
    body = Column(Text)
    payload = Column(JSON)
    opportunity_id = Column(String(36), ForeignKey("opportunities.id"), nullable=True)

    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    recipient = relationship("User", back_populates="notifications")
    source_agent = relationship("Agent")
    opportunity = relationship("Opportunity")
