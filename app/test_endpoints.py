from app.main import app, BASE_DIR, UPLOAD_DIR, get_settings, AuthErrorMessages
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


def test_invalid_file_upload():
    response = client.post("/") # request.post("") // python request package
    assert response.status_code == 422
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


def test_prediction_upload_missing_headers():
    img_saved_path = BASE_DIR / "images"
    settings = get_settings()
    for path in img_saved_path.glob("*"):
        try:
            img = Image.open(path)
        except:
            img = None
        response = client.post("/",
            files={"file": open(path, 'rb')}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == AuthErrorMessages.MISSING_AUTHORIZATION_HEADER


def test_prediction_upload():
    img_saved_path = BASE_DIR / "images"
    settings = get_settings()
    for path in img_saved_path.glob("*"):
        try:
            img = Image.open(path)
        except:
            img = None
        response = client.post("/", files={"file": open(path, "rb")},
                                    headers={"Authorization": f"JWT {settings.app_auth_token}"}
        )
        if img is None:
            assert response.status_code == 400
        else:
            # Returning a valid image
            assert response.status_code == 200
            data = response.json()
            assert len(data.keys()) == 2


def test_malformed_authorization_headers():
    """Test all malformed authorization header scenarios."""
    img_saved_path = BASE_DIR / "images"
    # Get first valid PNG image for testing
    test_image = None
    for path in img_saved_path.glob("*.png"):
        try:
            Image.open(path)
            test_image = path
            break
        except:
            continue

    if test_image is None:
        # Fallback to any valid image
        for path in img_saved_path.glob("*"):
            try:
                Image.open(path)
                test_image = path
                break
            except:
                continue

    assert test_image is not None, "No valid test images found"

    # Test cases: (header_value, expected_error_message)
    test_cases = [
        ("NoSpace", AuthErrorMessages.INVALID_AUTHORIZATION_FORMAT),
        ("Bearer", AuthErrorMessages.INVALID_AUTHORIZATION_FORMAT),  # Missing token
        ("Bearer  ", AuthErrorMessages.INVALID_AUTHORIZATION_FORMAT),  # Only whitespace
        ("Bearer token extra", AuthErrorMessages.INVALID_AUTHORIZATION_FORMAT),  # Too many parts
    ]

    for header_value, expected_message in test_cases:
        response = client.post(
            "/",
            files={"file": open(test_image, "rb")},
            headers={"Authorization": header_value}
        )
        assert response.status_code == 401, f"Failed for header: {header_value}"
        assert response.json()["detail"] == expected_message, f"Wrong message for header: {header_value}"


def test_invalid_authorization_token():
    """Test invalid token returns specific error."""
    img_saved_path = BASE_DIR / "images"
    # Get first valid image
    test_image = None
    for path in img_saved_path.glob("*"):
        try:
            Image.open(path)
            test_image = path
            break
        except:
            continue

    assert test_image is not None, "No valid test images found"

    response = client.post(
        "/",
        files={"file": open(test_image, "rb")},
        headers={"Authorization": "Bearer wrong-token-here"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == AuthErrorMessages.INVALID_AUTHORIZATION_TOKEN
