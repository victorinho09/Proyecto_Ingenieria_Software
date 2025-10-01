"""
Servidor principal de la aplicación web usando FastAPI.
Maneja las rutas y endpoints de la aplicación.
"""

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Importar módulos locales
from constants import *
from models import Cuenta, LoginData, Receta
from utils import verificar_archivo_existe

# Crear instancia de FastAPI
app = FastAPI(
    title="Aplicación Web de Recetas",
    description="API para gestión de recetas y creación de cuentas de usuario",
    version="1.0.0"
)

# Montar archivos estáticos
app.mount(f"/{DIRECTORIO_STATIC}", StaticFiles(directory=DIRECTORIO_STATIC), name=DIRECTORIO_STATIC)

@app.get("/", response_class=HTMLResponse)
def get_page():
    """
    Endpoint para servir la página principal.
    
    Returns:
        FileResponse: Página HTML principal o error 404
    """
    if verificar_archivo_existe(RUTA_INDEX):
        return FileResponse(RUTA_INDEX, media_type=CONTENT_TYPE_HTML)
    else:
        return HTMLResponse(
            content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
            status_code=HTTP_NOT_FOUND
        )

@app.get("/recetas", response_class=HTMLResponse)
def get_recetas():
    """
    Endpoint para servir la página de recetas.
    
    Returns:
        FileResponse: Página HTML de recetas o error 404
    """
    if verificar_archivo_existe(RUTA_RECETAS):
        return FileResponse(RUTA_RECETAS, media_type=CONTENT_TYPE_HTML)
    else:
        return HTMLResponse(
            content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
            status_code=HTTP_NOT_FOUND
        )

@app.get("/menu-semanal", response_class=HTMLResponse)
def get_menu_semanal():
    """
    Endpoint para servir la página del menú semanal.
    
    Returns:
        FileResponse: Página HTML del menú semanal o error 404
    """
    if verificar_archivo_existe(RUTA_MENU_SEMANAL):
        return FileResponse(RUTA_MENU_SEMANAL, media_type=CONTENT_TYPE_HTML)
    else:
        return HTMLResponse(
            content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
            status_code=HTTP_NOT_FOUND
        )
@app.post("/crear-cuenta")
async def crear_cuenta(cuenta: Cuenta):
    """
    Endpoint para crear una nueva cuenta de usuario.
    
    Args:
        cuenta (Cuenta): Datos básicos de la cuenta a crear
        
    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
                
        # Respuesta de éxito (diccionario simple)
        respuesta = {
            "mensaje": MENSAJE_CUENTA_CREADA,
            "exito": True,
            "usuario_creado": cuenta.nombreUsuario
        }
        
        return JSONResponse(content=respuesta, status_code=HTTP_OK)
        
    except Exception as e:        
        # Respuesta de error (diccionario simple)
        error_respuesta = {
            "mensaje": MENSAJE_ERROR_INTERNO,
            "exito": False,
            "codigo_error": "INTERNAL_ERROR"
        }
        
        return JSONResponse(content=error_respuesta, status_code=HTTP_INTERNAL_SERVER_ERROR)

@app.post("/iniciar-sesion")
async def iniciar_sesion(login_data: LoginData):
    """
    Endpoint para iniciar sesión (simulado).

    Args:
        login_data (LoginData): Datos de login (email y password)

    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
        respuesta = {
            "mensaje": MENSAJE_CUENTA_INICIADA,
            "exito": True,
            "usuario": login_data.email,
        }
        return JSONResponse(content=respuesta, status_code=HTTP_OK)
    
    except Exception as e:
        error_respuesta = {
            "mensaje": MENSAJE_ERROR_INTERNO,
            "exito": False,
            "codigo_error": "INTERNAL_ERROR",
        }
        return JSONResponse(content=error_respuesta, status_code=HTTP_INTERNAL_SERVER_ERROR)


@app.post("/crear-receta")
async def crear_receta(receta: Receta):
    """
    Endpoint para crear una nueva receta.
    
    Args:
        receta (Receta): Datos básicos de la receta a crear

    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
                
        # Respuesta de éxito (diccionario simple)
        respuesta = {
            "mensaje": MENSAJE_RECETA_CREADA,
            "exito": True,
            "receta_creada": receta.nombreReceta
        }
        
        return JSONResponse(content=respuesta, status_code=HTTP_OK)
        
    except Exception as e:        
        # Respuesta de error (diccionario simple)
        error_respuesta = {
            "mensaje": MENSAJE_ERROR_INTERNO,
            "exito": False,
            "codigo_error": "INTERNAL_ERROR"
        }
        
        return JSONResponse(content=error_respuesta, status_code=HTTP_INTERNAL_SERVER_ERROR)
