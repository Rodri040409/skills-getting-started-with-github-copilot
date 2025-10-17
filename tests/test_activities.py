from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities_returns_200_and_dict():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # ensure expected keys present
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    test_email = "test.user@example.com"

    # Ensure test_email is not already in participants
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert test_email in activities[activity]["participants"]

    # Signing up again should fail
    resp2 = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp2.status_code == 400

    # Unregister
    resp3 = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert resp3.status_code == 200
    assert test_email not in activities[activity]["participants"]

    # Unregistering again should 404
    resp4 = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert resp4.status_code == 404
