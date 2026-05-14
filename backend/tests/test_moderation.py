from .conftest import auth_headers, setup_picked


async def test_throw_clean_content_ok(client, alice_token):
    r = await client.post(
        "/api/bottles",
        json={"content": "今天天气真好，给海里写一封信"},
        headers=auth_headers(alice_token),
    )
    assert r.status_code == 201


async def test_throw_blocked_word_rejected(client, alice_token):
    r = await client.post(
        "/api/bottles",
        json={"content": "加我微信 12345 一起兼职日结"},
        headers=auth_headers(alice_token),
    )
    assert r.status_code == 400
    assert "违禁" in r.json()["detail"]


async def test_reply_blocked_word_rejected(client, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)
    r = await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "fuck off"},
        headers=auth_headers(bob_token),
    )
    assert r.status_code == 400


async def test_case_insensitive(client, alice_token):
    r = await client.post(
        "/api/bottles",
        json={"content": "FUCK"},
        headers=auth_headers(alice_token),
    )
    assert r.status_code == 400
