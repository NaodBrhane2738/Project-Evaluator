from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from config import settings
from routers import users, projects, ratings, leaderboard, activity, admin
from database import get_supabase

from contextlib import asynccontextmanager
import os

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize SQLite demo data if running in SQLite mode and DB is not found
    if not (settings.supabase_url and settings.supabase_url.startswith("https://")):
        from init_sqlite import init_sqlite_db, DB_PATH
        if not os.path.exists(DB_PATH) or os.path.getsize(DB_PATH) == 0:
            init_sqlite_db()
            try:
                import seed
                seed.seed()
            except Exception as e:
                print(f"Auto-seed notice: {e}")
    yield

app = FastAPI(title="CyberArena — Cybersecurity Competition Platform", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = settings.cors_origins if isinstance(settings.cors_origins, list) else [settings.cors_origins]
is_wildcard = "*" in origins or origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard else origins,
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(projects.router, prefix=settings.api_prefix)
app.include_router(ratings.router, prefix=settings.api_prefix)
app.include_router(leaderboard.router, prefix=settings.api_prefix)
app.include_router(activity.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)

@app.get("/health")
@app.get(f"{settings.api_prefix}/health")
def health_check():
    db = get_supabase()
    state_res = db.table('competition_state').select('status').eq('id', 1).single().execute()
    return {"status": "ok", "competition_status": state_res.data['status'] if state_res.data else 'voting_open'}

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
