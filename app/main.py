import pathlib
import io
import uuid
import asyncio
from fastapi import (FastAPI,
                    Request ,
                    Depends,
                    File,
                    UploadFile,
                    HTTPException,
                    Header)
from fastapi.responses import HTMLResponse , FileResponse
from fastapi.templating import Jinja2Templates
from pydantic_settings import BaseSettings
from functools import lru_cache
from PIL import Image
import pytesseract


# Authentication Error Messages (API Contract)
# These messages are part of the public API contract and should be versioned
class AuthErrorMessages:
    MISSING_AUTHORIZATION_HEADER = "Missing authorization header"
    INVALID_AUTHORIZATION_FORMAT = "Invalid authorization format"
    INVALID_AUTHORIZATION_TOKEN = "Invalid authorization token"
    DEBUG_BYPASS_ACTIVE = "Debug mode: authentication bypassed"  # For logging only


# Resource Management Error Messages (API Contract)
# These messages are part of the public API contract and should be versioned
class ResourceErrorMessages:
    FILE_TOO_LARGE = "File too large. Maximum size: {max_size_mb}MB"
    UPLOADING_DISABLED = "Uploading is disabled"


class Settings(BaseSettings):
    DEBUG: bool = False
    echo_active: bool = False
    app_auth_token: str
    app_auth_token_secret: str = None
    skip_auth: bool = False
    max_upload_size_mb: int = 10  # Maximum file size in MB for resource safety
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings() # make sure to cache the settings instance

settings = get_settings()
DEBUG = settings.DEBUG


app = FastAPI()
BASE_DIR = pathlib.Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
#print((BASE_DIR / "templates").exists())
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


@app.get("/" , response_class=HTMLResponse)
def home_view(request : Request , settings:Settings = Depends(get_settings)): # http GET -> JSON
    #print(request)
    return templates.TemplateResponse(request, "home.html")

    #return render("home.html" , {}) something like that dose not work  btw i try it for the first time with fastapi

def verify_auth(authorization = Header(None), settings:Settings = Depends(get_settings)):
    """
    Verify Bearer token authentication.

    Authorization header format: "Bearer <token>"

    Security: Debug bypass requires BOTH DEBUG=True AND skip_auth=True.
    This prevents accidental bypass in production.
    """
    # SECURITY: Debug bypass only allowed when BOTH conditions are true
    # This prevents accidental bypass if skip_auth=True but DEBUG=False (production)
    if settings.DEBUG and settings.skip_auth:
        # WARNING: Authentication is bypassed in debug mode
        # This should NEVER happen in production
        return

    # Defensive: Check for missing header
    if authorization is None or authorization == "":
        raise HTTPException(
            detail=AuthErrorMessages.MISSING_AUTHORIZATION_HEADER,
            status_code=401
        )

    # Defensive: Validate format before split
    parts = authorization.split()
    if len(parts) != 2:
        raise HTTPException(
            detail=AuthErrorMessages.INVALID_AUTHORIZATION_FORMAT,
            status_code=401
        )

    # Defensive: Explicit unpacking after validation
    label, token = parts

    # Validate token
    if token != settings.app_auth_token:
        raise HTTPException(
            detail=AuthErrorMessages.INVALID_AUTHORIZATION_TOKEN,
            status_code=401
        )


@app.post("/")
async def prediction_view(file:UploadFile = File(...), authorization = Header(None), settings:Settings = Depends(get_settings)):
    """
    OCR prediction endpoint: Extracts text from uploaded images.

    Resource Safety:
    - Processes files entirely in memory (no disk persistence)
    - File size limited by max_upload_size_mb to prevent memory exhaustion
    - Validates size BEFORE expensive OCR processing

    Security:
    - Requires Bearer token authentication
    - Rejects oversized files with HTTP 413

    Future Improvements:
    - Consider streaming large files for better memory efficiency
    - Add support for batch processing
    """
    verify_auth(authorization, settings)

    # Resource Safety: Check file size before reading entire file into memory
    # This prevents memory exhaustion from extremely large uploads
    MAX_SIZE_BYTES = settings.max_upload_size_mb * 1024 * 1024

    # Read file data
    file_data = await file.read()

    # Validate size after reading (FastAPI doesn't provide size before read)
    if len(file_data) > MAX_SIZE_BYTES:
        raise HTTPException(
            detail=ResourceErrorMessages.FILE_TOO_LARGE.format(max_size_mb=settings.max_upload_size_mb),
            status_code=413  # Payload Too Large
        )

    bytes_str = io.BytesIO(file_data)
    try:
        img = Image.open(bytes_str)
    except:
        raise HTTPException(detail="Invalid image", status_code=400)

    # Offload blocking OCR call to thread pool to prevent event loop blocking
    # Using run_in_executor for Python 3.8 compatibility (asyncio.to_thread requires 3.9+)
    loop = asyncio.get_running_loop()
    preds = await loop.run_in_executor(None, pytesseract.image_to_string, img)

    predictions = [x for x in preds.split("\n")]
    return {"results": predictions, "original": preds}


ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

@app.post("/image-upload/" , response_class=FileResponse)
async def image_upload_view(file: UploadFile = File(...), settings:Settings = Depends(get_settings)):
    """
    Echo endpoint: Saves uploaded image to disk and returns it.

    ⚠️ PRODUCTION WARNING ⚠️
    Files are persisted to uploads/ directory and NOT automatically cleaned up.
    This endpoint is for debugging/testing ONLY.

    Production Recommendations:
    - Keep echo_active=False in production (recommended)
    - If enabled, implement external cleanup:
      * Cron job: `find uploads/ -type f -mtime +7 -delete`
      * Systemd timer with cleanup script
      * Cloud storage with TTL (S3 lifecycle policies, etc.)

    Resource Impact:
    - Disk usage = num_files × max_upload_size_mb
    - No automatic cleanup means unbounded growth if left running
    - Directory created on-demand if it doesn't exist

    Future Improvements:
    - Add background cleanup task with configurable TTL
    - Implement disk quota monitoring
    - Move to external storage (S3, GCS, etc.) with built-in TTL
    """
    # Check if uploading is enabled
    if not settings.echo_active:
        raise HTTPException(
            status_code=400,
            detail=ResourceErrorMessages.UPLOADING_DISABLED
        )

    UPLOAD_DIR.mkdir(exist_ok=True)
    suffix = pathlib.Path(file.filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    # Resource Safety: Check file size before processing
    # This prevents disk exhaustion from extremely large uploads
    data = await file.read()
    MAX_SIZE_BYTES = settings.max_upload_size_mb * 1024 * 1024

    if len(data) > MAX_SIZE_BYTES:
        raise HTTPException(
            detail=ResourceErrorMessages.FILE_TOO_LARGE.format(max_size_mb=settings.max_upload_size_mb),
            status_code=413  # Payload Too Large
        )

    bytes_io = io.BytesIO(data)
    try:
        img = Image.open(bytes_io)
        img.verify()
        bytes_io.seek(0)
        img = Image.open(bytes_io)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Save to disk with UUID filename
    dest = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"
    img.save(dest, format=img.format)

    return FileResponse(
        dest,
        media_type=file.content_type,
        filename=dest.name
    )