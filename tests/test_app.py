from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_root_redirects_to_static():
    # Arrange: nothing needed

    # Act
    response = client.get("/")

    # Assert
    assert response.status_code == 200 or response.status_code == 307

def test_get_activities():
    # Arrange

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert all("participants" in v for v in data.values())

def test_signup_for_activity_success():
    # Arrange
    activity_name = list(client.get("/activities").json().keys())[0]
    email = "testuser@example.com"

    # Act
    response = client.post(f"/activities/{activity_name}/signup?email={email}")

    # Assert
    assert response.status_code == 200
    assert f"Signed up {email}" in response.json()["message"]

def test_signup_for_activity_not_found():
    # Arrange
    activity_name = "nonexistent"
    email = "testuser@example.com"

    # Act
    response = client.post(f"/activities/{activity_name}/signup?email={email}")

    # Assert
    assert response.status_code == 404

def test_signup_duplicate():
    # Arrange
    activity_name = list(client.get("/activities").json().keys())[0]
    email = "duplicate@example.com"
    client.post(f"/activities/{activity_name}/signup?email={email}")

    # Act
    response = client.post(f"/activities/{activity_name}/signup?email={email}")

    # Assert
    # Should NOT allow duplicate, should return 400
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"

# Add more tests for DELETE if you implement that endpoint
