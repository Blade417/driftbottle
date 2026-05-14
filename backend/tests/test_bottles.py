from .conftest import auth_headers


async def test_throw_then_mine(client, alice_token):
    r = await client.post(
        "/api/bottles", json={"content": "hello sea"}, headers=auth_headers(alice_token)
    )
    assert r.status_code == 201
    bottle = r.json()
    assert bottle["content"] == "hello sea"
    assert bottle["status"] == "floating"

    r = await client.get("/api/bottles/mine?type=thrown", headers=auth_headers(alice_token))
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["id"] == bottle["id"]


async def test_pick_someone_elses_bottle(client, alice_token, bob_token):
    r = await client.post(
        "/api/bottles", json={"content": "for whoever"}, headers=auth_headers(alice_token)
    )
    bottle_id = r.json()["id"]

    r = await client.get("/api/bottles/pick", headers=auth_headers(bob_token))
    assert r.status_code == 200
    assert r.json()["id"] == bottle_id
    assert r.json()["status"] == "picked"


async def test_cannot_pick_own_bottle(client, alice_token):
    await client.post(
        "/api/bottles", json={"content": "mine alone"}, headers=auth_headers(alice_token)
    )
    r = await client.get("/api/bottles/pick", headers=auth_headers(alice_token))
    assert r.status_code == 404


async def test_daily_throw_limit(client, alice_token):
    for i in range(3):
        r = await client.post(
            "/api/bottles", json={"content": f"bottle {i}"}, headers=auth_headers(alice_token)
        )
        assert r.status_code == 201
    r = await client.post(
        "/api/bottles", json={"content": "too many"}, headers=auth_headers(alice_token)
    )
    assert r.status_code == 429


async def test_detail_forbidden_for_outsider(client, alice_token, bob_token):
    r = await client.post(
        "/api/bottles", json={"content": "private"}, headers=auth_headers(alice_token)
    )
    bottle_id = r.json()["id"]
    r = await client.get(f"/api/bottles/{bottle_id}", headers=auth_headers(bob_token))
    assert r.status_code == 403


async def test_detail_visible_to_author(client, alice_token):
    r = await client.post(
        "/api/bottles", json={"content": "private"}, headers=auth_headers(alice_token)
    )
    bottle_id = r.json()["id"]
    r = await client.get(f"/api/bottles/{bottle_id}", headers=auth_headers(alice_token))
    assert r.status_code == 200
    assert r.json()["is_mine"] is True
    assert r.json()["is_picker"] is False
