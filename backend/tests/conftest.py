import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-do-not-use-in-prod"

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import update
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.limiter import limiter
from app.services import auth_service
from app.models.user import User


@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        echo=False,
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def session_factory(engine):
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def client(session_factory, monkeypatch):
    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    prev_enabled = limiter.enabled
    limiter.enabled = False

    auth_service._verify_codes.clear()
    auth_service._resend_cooldown.clear()
    monkeypatch.setattr(auth_service, "_send_code_email", lambda *a, **kw: None)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
    limiter.enabled = prev_enabled


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def register_user(client: AsyncClient, email: str, password: str = "password123") -> dict:
    r = await client.post("/api/auth/send-code", json={"email": email})
    assert r.status_code == 200, r.text
    code, _ = auth_service._verify_codes[email]
    r = await client.post(
        "/api/auth/register", json={"email": email, "code": code, "password": password}
    )
    assert r.status_code == 201, r.text
    return r.json()


async def login_user(client: AsyncClient, email: str, password: str = "password123") -> str:
    r = await client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


async def register_and_login(client: AsyncClient, email: str, password: str = "password123") -> str:
    await register_user(client, email, password)
    return await login_user(client, email, password)


@pytest_asyncio.fixture
async def alice_token(client):
    return await register_and_login(client, "alice@test.com")


@pytest_asyncio.fixture
async def bob_token(client):
    return await register_and_login(client, "bob@test.com")


@pytest_asyncio.fixture
async def admin_token(client, session_factory):
    token = await register_and_login(client, "admin@test.com")
    async with session_factory() as session:
        await session.execute(
            update(User).where(User.email == "admin@test.com").values(is_admin=True)
        )
        await session.commit()
    return token


async def setup_picked(client: AsyncClient, author_token: str, picker_token: str, content: str = "hi sea") -> str:
    r = await client.post(
        "/api/bottles", json={"content": content}, headers=auth_headers(author_token)
    )
    assert r.status_code == 201, r.text
    bottle_id = r.json()["id"]
    r = await client.get("/api/bottles/pick", headers=auth_headers(picker_token))
    assert r.status_code == 200, r.text
    assert r.json()["id"] == bottle_id
    return bottle_id
