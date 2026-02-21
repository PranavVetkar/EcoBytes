import logging

import app.firebase  # noqa: F401 — triggers Firebase Admin SDK init on startup (Firestore)
from app.config import settings
from app.routers import auth
from app.routers import (
    communities,
    eco_actions,
    comments,
    events,
    feed,
    rewards,
    users,
    verification,
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TerraScore API",
    version="0.1.0",
    description="Backend API for the TerraScore environmental impact tracking platform.",
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api/v1/auth",          tags=["auth"])
app.include_router(users.router,         prefix="/api/v1/users",         tags=["users"])
app.include_router(eco_actions.router,   prefix="/api/v1/actions",       tags=["eco-actions"])
app.include_router(comments.router,      prefix="/api/v1/comments",      tags=["comments"])
app.include_router(feed.router,          prefix="/api/v1/feed",          tags=["feed"])
app.include_router(communities.router,   prefix="/api/v1/communities",   tags=["communities"])
app.include_router(events.router,        prefix="/api/v1/events",        tags=["events"])
app.include_router(rewards.router,       prefix="/api/v1/rewards",       tags=["rewards"])
app.include_router(verification.router,  prefix="/api/v1/verification",  tags=["verification"])


# ── Health check ──────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "env": settings.app_env}


# Trigger reload
