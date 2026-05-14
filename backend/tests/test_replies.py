from .conftest import auth_headers, setup_picked


async def test_picker_replies_first(client, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)
    r = await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "hi alice"},
        headers=auth_headers(bob_token),
    )
    assert r.status_code == 201
    assert r.json()["round"] == 1
    assert r.json()["is_mine"] is True


async def test_author_cannot_reply_first(client, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)
    r = await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "i started"},
        headers=auth_headers(alice_token),
    )
    assert r.status_code == 400


async def test_alternating_rounds(client, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)

    r = await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "r1"},
        headers=auth_headers(bob_token),
    )
    assert r.json()["round"] == 1

    r = await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "r2"},
        headers=auth_headers(alice_token),
    )
    assert r.json()["round"] == 2

    r = await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "r3"},
        headers=auth_headers(bob_token),
    )
    assert r.json()["round"] == 3

    r = await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "out of turn"},
        headers=auth_headers(bob_token),
    )
    assert r.status_code == 400


async def test_cannot_reply_floating_bottle(client, alice_token, bob_token):
    r = await client.post(
        "/api/bottles", json={"content": "alone"}, headers=auth_headers(alice_token)
    )
    bottle_id = r.json()["id"]
    r = await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "too early"},
        headers=auth_headers(alice_token),
    )
    assert r.status_code == 400
