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

@app.post("/image-upload/" , response_class=FileResponse)
async def image_upload_view(file: UploadFile = File(...), settings:Settings = Depends(get_settings)):
    if not settings.echo_active:
        raise HTTPException(status_code=400 , detail="Uploading is disabled.")
    bytes_str = io.BytesIO(await file.read()) # read file as bytes
    fname = pathlib.Path(file.filename)
    fext = fname.suffix # get file extension like .jpg , .png etc.....:)
    dest = UPLOAD_DIR / f"{uuid.uuid1()}{fext}" # create a unique file name
    with open(dest, "wb") as f:
        f.write(bytes_str.read())

    return dest