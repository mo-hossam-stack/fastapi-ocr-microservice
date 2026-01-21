import pathlib
import io
import uuid
import asyncio
import logging
import time
import sys
from fastapi import (FastAPI,
                    Request ,
                    Depends,
                    File,
                    UploadFile,
                    HTTPException,
                    Header)
from fastapi.responses import HTMLResponse , FileResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic_settings import BaseSettings
from functools import lru_cache
from PIL import Image
import pytesseract
from starlette.middleware.base import BaseHTTPMiddleware

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(module)s", "message": %(message)s}',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ocr-service")

def log_json(message_dict):
    import json
    logger.info(json.dumps(message_dict))

# Authentication Error Messages (API Contract)
class AuthErrorMessages:
    MISSING_AUTHORIZATION_HEADER = "Missing authorization header"
    INVALID_AUTHORIZATION_FORMAT = "Invalid authorization format"
    INVALID_AUTHORIZATION_TOKEN = "Invalid authorization token"

# Resource Management Error Messages (API Contract)
class ResourceErrorMessages:
    FILE_TOO_LARGE = "File too large. Maximum size: {max_size_mb}MB"
    UPLOADING_DISABLED = "Uploading is disabled"
    TIMEOUT = "OCR execution timed out"

class Settings(BaseSettings):
    DEBUG: bool = False
    echo_active: bool = False
    app_auth_token: str
    app_auth_token_secret: str = None
    skip_auth: bool = False
    max_upload_size_mb: int = 10
    ocr_timeout_seconds: float = 30.0
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
app = FastAPI()

# Structured Logging Middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time

        log_json({
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration": f"{process_time:.4f}s"
        })
        return response

app.add_middleware(LoggingMiddleware)

BASE_DIR = pathlib.Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@app.get("/health")
def health_check():
    """Liveness probe: Returns 200 OK if service is running."""
    return {"status": "ok"}

@app.get("/ready")
def readiness_check():
    """Readiness probe: Verifies OCR dependency availability."""
    try:
        version = pytesseract.get_tesseract_version()
        return {"status": "ready", "tesseract_version": str(version)}
    except Exception as e:
        log_json({"error": "Readiness check failed", "detail": str(e)})
        raise HTTPException(status_code=503, detail="OCR engine not available")

@app.get("/" , response_class=HTMLResponse)
def home_view(request : Request):
    return templates.TemplateResponse(request, "home.html")

def verify_auth(authorization = Header(None), settings:Settings = Depends(get_settings)):
    if settings.DEBUG and settings.skip_auth:
        return
    if authorization is None or authorization == "":
        raise HTTPException(detail=AuthErrorMessages.MISSING_AUTHORIZATION_HEADER, status_code=401)
    parts = authorization.split()
    if len(parts) != 2:
        raise HTTPException(detail=AuthErrorMessages.INVALID_AUTHORIZATION_FORMAT, status_code=401)
    label, token = parts
    if token != settings.app_auth_token:
        raise HTTPException(detail=AuthErrorMessages.INVALID_AUTHORIZATION_TOKEN, status_code=401)

async def validate_file_size(request: Request, settings: Settings):
    """Proactively validate file size using Content-Length if available."""
    content_length = request.headers.get("content-length")
    if content_length:
        if int(content_length) > (settings.max_upload_size_mb * 1024 * 1024):
            log_json({"error": "Payload too large", "content_length": content_length})
            raise HTTPException(
                status_code=413,
                detail=ResourceErrorMessages.FILE_TOO_LARGE.format(max_size_mb=settings.max_upload_size_mb)
            )

@app.post("/")
async def prediction_view(
    request: Request,
    file: UploadFile = File(...),
    authorization = Header(None),
    settings: Settings = Depends(get_settings)
):
    verify_auth(authorization, settings)
    await validate_file_size(request, settings)

    file_data = await file.read()
    # Secondary check in case Content-Length was missing or spoofed
    if len(file_data) > (settings.max_upload_size_mb * 1024 * 1024):
        raise HTTPException(
            status_code=413,
            detail=ResourceErrorMessages.FILE_TOO_LARGE.format(max_size_mb=settings.max_upload_size_mb)
        )

    bytes_str = io.BytesIO(file_data)
    try:
        img = Image.open(bytes_str)
    except:
        raise HTTPException(detail="Invalid image", status_code=400)

    preds = await run_ocr(img, settings.ocr_timeout_seconds)

    predictions = [x for x in preds.split("\n")]
    return {"results": predictions, "original": preds}

async def run_ocr(img: Image.Image, timeout: float) -> str:
    """Execute OCR with timeout safety."""
    loop = asyncio.get_running_loop()
    try:
        return await asyncio.wait_for(
            loop.run_in_executor(None, pytesseract.image_to_string, img),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        log_json({"error": "OCR Timeout", "timeout": timeout})
        raise HTTPException(status_code=504, detail=ResourceErrorMessages.TIMEOUT)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

@app.post("/image-upload/" , response_class=FileResponse)
async def image_upload_view(
    request: Request,
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings)
):
    if not settings.echo_active:
        raise HTTPException(status_code=400, detail=ResourceErrorMessages.UPLOADING_DISABLED)

    await validate_file_size(request, settings)

    UPLOAD_DIR.mkdir(exist_ok=True)
    suffix = pathlib.Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    data = await file.read()
    if len(data) > (settings.max_upload_size_mb * 1024 * 1024):
        raise HTTPException(
            status_code=413,
            detail=ResourceErrorMessages.FILE_TOO_LARGE.format(max_size_mb=settings.max_upload_size_mb)
        )

    bytes_io = io.BytesIO(data)
    try:
        img = Image.open(bytes_io)
        img.verify()
        bytes_io.seek(0)
        img = Image.open(bytes_io)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    dest = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"
    img.save(dest, format=img.format)

    return FileResponse(dest, media_type=file.content_type, filename=dest.name)