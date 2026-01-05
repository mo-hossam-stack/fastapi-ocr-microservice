import pathlib
from fastapi import FastAPI , Request
from fastapi.responses import HTMLResponse 
from fastapi.templating import Jinja2Templates


app = FastAPI()
BASE_DIR = pathlib.Path(__file__).parent
#print((BASE_DIR / "templates").exists())
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


@app.get("/" , response_class=HTMLResponse)
def home_view(request : Request): # http GET -> JSON
    #print(request)
    return templates.TemplateResponse(request, "home.html")

    #return render("home.html" , {}) something like that dose not work  btw i try it for the first time with fastapi



@app.post("/")
def home_detail_view():
    return {"hi": "Mohamed"}
