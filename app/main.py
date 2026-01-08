import pathlib
from fastapi import FastAPI , Request , Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DEBUG: bool = False

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings() # make sure to cache the settings instance

settings = get_settings()
DEBUG = settings.DEBUG


app = FastAPI()
BASE_DIR = pathlib.Path(__file__).parent
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
