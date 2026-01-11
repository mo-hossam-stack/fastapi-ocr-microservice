import pathlib
import io
import uuid
from fastapi import (FastAPI,
                    Request ,
                    Depends,
                    File,
                    UploadFile,
                    HTTPException)
from fastapi.responses import HTMLResponse , FileResponse
from fastapi.templating import Jinja2Templates
from pydantic_settings import BaseSettings
from functools import lru_cache
from PIL import Image
class Settings(BaseSettings):
    DEBUG: bool = False
    echo_active: bool = False
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



@app.post("/")
def home_detail_view():
    return {"hi": "Mohamed"}

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

@app.post("/image-upload/" , response_class=FileResponse)
async def image_upload_view(file: UploadFile = File(...), settings:Settings = Depends(get_settings)):
    if not settings.echo_active:
        raise HTTPException(status_code=400 , detail="Uploading is disabled.")
    UPLOAD_DIR.mkdir(exist_ok=True)
    suffix = pathlib.Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported image type")
    data = await file.read()
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
    return FileResponse(
        dest,
        media_type=file.content_type,
        filename=dest.name
    )