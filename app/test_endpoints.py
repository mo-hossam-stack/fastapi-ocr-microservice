from app.main import app,BASE_DIR, UPLOAD_DIR
from fastapi.testclient import TestClient
import shutil
import time
import io
from PIL import Image, ImageChops
client = TestClient(app)

def test_get_home():
    response = client.get("/") # request.get("") // python request package
    assert response.status_code == 200
    assert "text/html" in response.headers['content-type']

def test_home_home():
    response = client.post("/") # request.post("") // python request package
    assert response.status_code == 200
    assert "application/json" in response.headers['content-type']

def test_echo_upload():
    img_saved_path = BASE_DIR / "images"
    ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

    for path in img_saved_path.glob("*"):
        suffix = path.suffix.lower()

        try:
            img = Image.open(path)
            is_real_image = True
        except Exception:
            img = None
            is_real_image = False

        response = client.post(
            "/image-upload/",
            files={"file": open(path, "rb")}
        )

        if suffix not in ALLOWED_EXTENSIONS:
            assert response.status_code == 415

        elif not is_real_image:
            assert response.status_code == 400

        else:
            assert response.status_code == 200

            r_stream = io.BytesIO(response.content)
            echo_img = Image.open(r_stream)

            echo_img = echo_img.convert("RGB")
            img = img.convert("RGB")

            difference = ImageChops.difference(echo_img, img).getbbox()
            assert difference is None

    shutil.rmtree(UPLOAD_DIR)
