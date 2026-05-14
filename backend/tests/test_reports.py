from .conftest import auth_headers, setup_picked


async def test_report_bottle(client, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)
    r = await client.post(
        "/api/reports",
        json={"bottle_id": bottle_id, "reason": "spam"},
        headers=auth_headers(bob_token),
    )
    assert r.status_code == 201
    assert "id" in r.json()


async def test_cannot_report_own_bottle(client, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)
    r = await client.post(
        "/api/reports",
        json={"bottle_id": bottle_id, "reason": "spam"},
        headers=auth_headers(alice_token),
    )
    assert r.status_code == 400


async def test_cannot_report_nonexistent_bottle(client, alice_token):
    r = await client.post(
        "/api/reports",
        json={"bottle_id": "00000000-0000-0000-0000-000000000000", "reason": "spam"},
        headers=auth_headers(alice_token),
    )
    assert r.status_code == 400


async def test_cannot_report_same_bottle_twice(client, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)
    r = await client.post(
        "/api/reports",
        json={"bottle_id": bottle_id, "reason": "spam"},
        headers=auth_headers(bob_token),
    )
    assert r.status_code == 201
    r = await client.post(
        "/api/reports",
        json={"bottle_id": bottle_id, "reason": "again"},
        headers=auth_headers(bob_token),
    )
    assert r.status_code == 400


async def test_must_specify_target(client, alice_token):
    r = await client.post(
        "/api/reports", json={"reason": "nothing"}, headers=auth_headers(alice_token)
    )
    assert r.status_code == 400


async def test_report_reply(client, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)
    r = await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "rude"},
        headers=auth_headers(bob_token),
    )
    reply_id = r.json()["id"]
    r = await client.post(
        "/api/reports",
        json={"reply_id": reply_id, "reason": "abusive"},
        headers=auth_headers(alice_token),
    )
    assert r.status_code == 201


async def test_cannot_report_own_reply(client, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)
    r = await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "x"},
        headers=auth_headers(bob_token),
    )
    reply_id = r.json()["id"]
    r = await client.post(
        "/api/reports",
        json={"reply_id": reply_id, "reason": "self"},
        headers=auth_headers(bob_token),
    )
    assert r.status_code == 400
