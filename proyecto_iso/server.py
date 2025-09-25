from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse
import os

RUTA_INDEX = "./static/index.html"
RUTA_RECETAS = "./static/recetas.html"
RUTA_MENU_SEMANAL = "./static/menusemanal.html"

app = FastAPI()

@app.get("/")
def get_page():
    if os.path.exists(RUTA_INDEX):
        return FileResponse(RUTA_INDEX, media_type="text/html")
    else:
        return HTMLResponse(content="<h1>Error: Archivo no encontrado</h1>", status_code=404)

@app.get("/recetas")
def get_recetas():
    if os.path.exists(RUTA_RECETAS):
        return FileResponse(RUTA_RECETAS, media_type="text/html")
    else:
        return HTMLResponse(content="<h1>Error: Archivo no encontrado</h1>", status_code=404)

@app.get("/menusemanal")
def get_menu_semanal():
    if os.path.exists(RUTA_MENU_SEMANAL):
        return FileResponse(RUTA_MENU_SEMANAL, media_type="text/html")
    else:
        return HTMLResponse(content="<h1>Error: Archivo no encontrado</h1>", status_code=404)
      
