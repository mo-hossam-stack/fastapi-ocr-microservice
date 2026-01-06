from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_get_home():
    response = client.get("/") # request.get("") // python request package
    assert response.status_code == 200
    assert "text/html" in response.headers['content-type']

def test_home_home():
    response = client.post("/") # request.post("") // python request package
    assert response.status_code == 200
    assert "application/json" in response.headers['content-type']
