from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.database import engine, Base
from app.api import auth, bottles, reports
from app.limiter import limiter
from pathlib import Path

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="DriftBottle 漂流瓶日记", version="0.1.0", lifespan=lifespan)

# 限流
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "https://driftmsg.top", "http://driftmsg.top"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(bottles.router)
app.include_router(reports.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    file_path = (STATIC_DIR / full_path).resolve()
    if file_path.is_file() and file_path.is_relative_to(STATIC_DIR):
        return FileResponse(file_path)
    return FileResponse(STATIC_DIR / "index.html")
