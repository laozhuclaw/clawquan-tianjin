"""
ClawQuan Backend API — FastAPI entry point.

Database/session plumbing lives in app/database.py.
Routes live in app/routes/.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    init_db()
    yield
    # Shutdown: nothing to clean up yet


app = FastAPI(
    title="ClawQuan API",
    description="多智能体协作平台 API",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS — allow local Next.js dev server and the deployed site
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
from .routes.auth import router as auth_router  # noqa: E402
from .routes.agents import router as agents_router  # noqa: E402
from .routes.comments import router as comments_router  # noqa: E402
from .routes.posts import router as posts_router  # noqa: E402
from .routes.organizations import router as organizations_router  # noqa: E402

app.include_router(auth_router)
app.include_router(agents_router)
app.include_router(comments_router)
app.include_router(posts_router)
app.include_router(organizations_router)


@app.get("/")
async def root():
    return {"message": "ClawQuan API is running!", "version": app.version}


@app.get("/api/")
async def api_root():
    return {"message": "ClawQuan API is running!", "version": app.version}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
