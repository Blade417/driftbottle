from .conftest import auth_headers, setup_picked


async def test_stats_requires_admin(client, alice_token):
    r = await client.get("/api/admin/stats", headers=auth_headers(alice_token))
    assert r.status_code == 403


async def test_admin_stats(client, admin_token):
    r = await client.get("/api/admin/stats", headers=auth_headers(admin_token))
    assert r.status_code == 200
    body = r.json()
    assert "users_total" in body
    assert "bottles_total" in body
    assert "reports_pending" in body


async def test_admin_list_bottles(client, admin_token, alice_token):
    await client.post(
        "/api/bottles", json={"content": "a bottle"}, headers=auth_headers(alice_token)
    )
    r = await client.get("/api/admin/bottles", headers=auth_headers(admin_token))
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert len(body["items"]) >= 1


async def test_admin_remove_bottle_cascades(client, admin_token, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)
    await client.post(
        f"/api/bottles/{bottle_id}/reply",
        json={"content": "round 1"},
        headers=auth_headers(bob_token),
    )

    r = await client.post(
        f"/api/admin/bottles/{bottle_id}/remove", headers=auth_headers(admin_token)
    )
    assert r.status_code == 200
    body = r.json()
    assert body["bottle_removed"] is True
    assert body["replies_deleted"] == 1


async def test_admin_resolve_report(client, admin_token, alice_token, bob_token):
    bottle_id = await setup_picked(client, alice_token, bob_token)
    r = await client.post(
        "/api/reports",
        json={"bottle_id": bottle_id, "reason": "bad"},
        headers=auth_headers(bob_token),
    )
    report_id = r.json()["id"]

    r = await client.post(
        f"/api/admin/reports/{report_id}/resolve",
        json={"action": "reject", "note": "fine"},
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 200
    assert r.json()["status"] == "rejected"
