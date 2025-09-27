from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from pydantic import BaseModel

RUTA_INDEX = "./static/index.html"
RUTA_RECETAS = "./static/recetas.html"
RUTA_MENU_SEMANAL = "./static/menusemanal.html"

class Cuenta(BaseModel):
    nombreUsuario: str
    email: str
    password: str

app = FastAPI()

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

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

@app.get("/menu-semanal")
def get_menu_semanal():
    if os.path.exists(RUTA_MENU_SEMANAL):
        return FileResponse(RUTA_MENU_SEMANAL, media_type="text/html")
    else:
        return HTMLResponse(content="<h1>Error: Archivo no encontrado</h1>", status_code=404)
    
@app.post("/crear-cuenta")
async def crear_cuenta(cuenta: Cuenta):
    try:
        return JSONResponse(
            content={"mensaje": "Cuenta creada con éxito", "exito": True},
            status_code=200
        )
        
    except ValueError as e:
        # Error de validación de Pydantic
        print(f"❌ Error de validación: {e}")
        return JSONResponse(
            content={"mensaje": f"Error de validación: {e}", "exito": False},
            status_code=400
        )
    
    except Exception as e:
        # Error inesperado
        print(f"❌ Error inesperado: {e}")
        return JSONResponse(
            content={"mensaje": "Error interno del servidor", "exito": False},
            status_code=500
        )
