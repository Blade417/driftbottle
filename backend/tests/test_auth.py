from app.services import auth_service
from .conftest import auth_headers, register_user


async def test_send_code_then_register(client):
    r = await client.post("/api/auth/send-code", json={"email": "new@test.com"})
    assert r.status_code == 200
    code, _ = auth_service._verify_codes["new@test.com"]

    r = await client.post(
        "/api/auth/register",
        json={"email": "new@test.com", "code": code, "password": "password123"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "new@test.com"
    assert body["is_verified"] is True
    assert body["is_admin"] is False


async def test_register_wrong_code_fails(client):
    await client.post("/api/auth/send-code", json={"email": "x@test.com"})
    r = await client.post(
        "/api/auth/register",
        json={"email": "x@test.com", "code": "000000", "password": "password123"},
    )
    assert r.status_code == 400


async def test_login_and_me(client, alice_token):
    r = await client.get("/api/auth/me", headers=auth_headers(alice_token))
    assert r.status_code == 200
    assert r.json()["email"] == "alice@test.com"


async def test_login_wrong_password_fails(client):
    await register_user(client, "wrongpw@test.com", password="correct123")
    r = await client.post(
        "/api/auth/login",
        json={"email": "wrongpw@test.com", "password": "wrong-password"},
    )
    assert r.status_code == 401


async def test_send_code_for_registered_email_fails(client, alice_token):
    r = await client.post("/api/auth/send-code", json={"email": "alice@test.com"})
    assert r.status_code == 400


async def test_me_without_token(client):
    r = await client.get("/api/auth/me")
    # HTTPBearer returns 403 when no Authorization header
    assert r.status_code in (401, 403)
