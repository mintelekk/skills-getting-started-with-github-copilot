import copy
import pytest
from fastapi.testclient import TestClient

from src import app as app_module

# keep a pristine copy of the initial activities data so tests can reset
_INITIAL_ACTIVITIES = copy.deepcopy(app_module.activities)

client = TestClient(app_module.app)

@pytest.fixture(autouse=True)
def reset_activities():
    # restore the global activities dict before each test
    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(_INITIAL_ACTIVITIES))


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # basic keys from initial data
    assert "Chess Club" in data
    assert "Programming Class" in data
    assert "Gym Class" in data
    assert "Art Club" in data


def test_signup_success():
    email = "newstudent@mergington.edu"
    resp = client.post("/activities/Chess Club/signup", params={"email": email})
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for Chess Club"

    # verify participant added
    activities = client.get("/activities").json()
    assert email in activities["Chess Club"]["participants"]


def test_signup_duplicate():
    email = "dup@mergington.edu"
    # first time should succeed
    r1 = client.post("/activities/Gym Class/signup", params={"email": email})
    assert r1.status_code == 200
    # second time should return 400
    r2 = client.post("/activities/Gym Class/signup", params={"email": email})
    assert r2.status_code == 400
    assert r2.json().get("detail") == "already registered"


def test_signup_nonexistent():
    resp = client.post("/activities/NoSuch/signup", params={"email": "x@x.com"})
    assert resp.status_code == 404


def test_unregister_success():
    email = "remove@mergington.edu"
    # add then remove
    client.post("/activities/Programming Class/signup", params={"email": email})
    r = client.delete("/activities/Programming Class/signup", params={"email": email})
    assert r.status_code == 200
    assert "Unregistered" in r.json()["message"]
    activities = client.get("/activities").json()
    assert email not in activities["Programming Class"]["participants"]


def test_unregister_not_registered():
    resp = client.delete("/activities/Chess Club/signup", params={"email": "ghost@mergington.edu"})
    assert resp.status_code == 404
