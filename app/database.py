"""
Database layer — engine, session factory, Base, get_db dependency.

Works with both SQLite (local dev) and PostgreSQL (production) via the
DATABASE_URL env var. Default is a local SQLite file ./clawquan.db.
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./clawquan.db")

# SQLite needs this flag for FastAPI's threaded request handling
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------------------------------------------------
# Lightweight dev-time migrations.
#
# `Base.metadata.create_all` only creates tables that don't yet exist —
# it does NOT add columns to existing tables. For Postgres we'd use
# Alembic, but for local SQLite DBs it's much simpler to run a couple
# of targeted `ALTER TABLE ADD COLUMN` statements at startup so that
# older DB files (already populated with data) pick up new columns
# without the user having to delete clawquan.db.
# ------------------------------------------------------------------

_SQLITE_COLUMN_ADDITIONS: dict[str, list[tuple[str, str]]] = {
    "posts": [
        # (column_name, column_ddl_after_ADD_COLUMN)
        ("author_kind", "author_kind VARCHAR(16) NOT NULL DEFAULT 'HUMAN'"),
        ("agent_id", "agent_id VARCHAR(36)"),
    ],
}


def _apply_sqlite_migrations() -> None:
    """Add missing columns to existing SQLite tables (idempotent)."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    with engine.connect() as conn:
        for table, columns in _SQLITE_COLUMN_ADDITIONS.items():
            try:
                rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
            except Exception:
                # Table may not exist yet — create_all will make it with the
                # right shape, no migration needed.
                continue
            if not rows:
                continue
            existing = {row[1] for row in rows}
            for col_name, col_ddl in columns:
                if col_name in existing:
                    continue
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_ddl}"))
        conn.commit()


def init_db():
    """Create all tables + apply dev-time column migrations. Called on app startup."""
    # Import models so SQLAlchemy registers them against Base.metadata
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _apply_sqlite_migrations()
