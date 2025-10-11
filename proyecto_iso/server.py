"""
Servidor principal de la aplicación web usando FastAPI.
Maneja las rutas y endpoints de la aplicación.
"""

from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

# Importar módulos locales
from constants import *
from models import Cuenta, LoginData, Receta
from utils import verificar_archivo_existe, guardar_nueva_cuenta, email_ya_existe, validar_cuenta, validar_password

# Crear instancia de FastAPI
app = FastAPI(
    title="Aplicación Web de Recetas",
    description="API para gestión de recetas y creación de cuentas de usuario",
    version="1.0.0"
)

# Montar archivos estáticos
app.mount(f"/{DIRECTORIO_STATIC}", StaticFiles(directory=DIRECTORIO_STATIC), name=DIRECTORIO_STATIC)

# ==================== FUNCIONES DE UTILIDAD PARA COOKIES ====================

def establecer_estado_usuario(response: Response, estado: str):
    """Establece el estado del usuario en una cookie."""
    response.set_cookie(key=COOKIE_ESTADO_USUARIO, value=estado, max_age=86400)  # 24 horas

def obtener_estado_usuario(request: Request) -> str:
    """Obtiene el estado del usuario desde la cookie."""
    return request.cookies.get(COOKIE_ESTADO_USUARIO, ESTADO_INVITADO)

def es_usuario_registrado(request: Request) -> bool:
    """Verifica si el usuario está registrado según la cookie."""
    return obtener_estado_usuario(request) == ESTADO_REGISTRADO

# ==================== ENDPOINTS ====================

@app.get("/", response_class=HTMLResponse)
def get_page(request: Request, response: Response, logout: bool = False):
    """
    Endpoint para servir la página principal.
    Sirve la página según el estado del usuario (invitado o registrado).
    
    Args:
        logout: Si es True, fuerza el estado a invitado (usado después de logout)
    
    Returns:
        FileResponse: Página HTML según el estado del usuario
    """
    # Si viene de un logout, forzar estado de invitado
    if logout:
        establecer_estado_usuario(response, ESTADO_INVITADO)
        # Servir directamente página de invitado con cookie establecida
        if verificar_archivo_existe(RUTA_USUARIO_INVITADO):
            file_response = FileResponse(RUTA_USUARIO_INVITADO, media_type=CONTENT_TYPE_HTML)
            # Establecer cookie en la respuesta
            file_response.set_cookie(
                key=COOKIE_ESTADO_USUARIO, 
                value=ESTADO_INVITADO, 
                max_age=86400
            )
            return file_response
        else:
            return HTMLResponse(
                content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
                status_code=HTTP_NOT_FOUND
            )
    
    # Si no hay cookie de estado, establecer como invitado por defecto
    if COOKIE_ESTADO_USUARIO not in request.cookies:
        establecer_estado_usuario(response, ESTADO_INVITADO)
    
    # Verificar si el usuario está registrado según la cookie
    if es_usuario_registrado(request):
        # Usuario registrado: servir página de registrado
        if verificar_archivo_existe(RUTA_USUARIO_REGISTRADO):
            return FileResponse(RUTA_USUARIO_REGISTRADO, media_type=CONTENT_TYPE_HTML)
        else:
            return HTMLResponse(
                content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
                status_code=HTTP_NOT_FOUND
            )
    else:
        # Usuario invitado: servir página de invitado
        if verificar_archivo_existe(RUTA_USUARIO_INVITADO):
            return FileResponse(RUTA_USUARIO_INVITADO, media_type=CONTENT_TYPE_HTML)
        else:
            return HTMLResponse(
                content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
                status_code=HTTP_NOT_FOUND
            )

@app.get("/recetas", response_class=HTMLResponse)
def get_recetas(request: Request):
    """
    Endpoint para servir la página de recetas.
    Solo accesible para usuarios autenticados.
    
    Returns:
        FileResponse: Página HTML de recetas o redirección a página principal
    """
    # Verificar si el usuario está autenticado
    if not es_usuario_registrado(request):
        # Usuario no autenticado: redirigir a página principal
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/", status_code=302)
    
    # Usuario autenticado: servir página de recetas
    if verificar_archivo_existe(RUTA_RECETAS):
        return FileResponse(RUTA_RECETAS, media_type=CONTENT_TYPE_HTML)
    else:
        return HTMLResponse(
            content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
            status_code=HTTP_NOT_FOUND
        )

@app.get("/mis-recetas", response_class=HTMLResponse)
def get_mis_recetas(request: Request):
    """
    Endpoint para servir la página de mis recetas.
    Solo accesible para usuarios autenticados.
    
    Returns:
        FileResponse: Página HTML de mis recetas o redirección a página principal
    """
    # Verificar si el usuario está autenticado
    if not es_usuario_registrado(request):
        # Usuario no autenticado: redirigir a página principal
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/", status_code=302)
    
    # Usuario autenticado: servir página de mis recetas
    if verificar_archivo_existe(RUTA_MIS_RECETAS):
        return FileResponse(RUTA_MIS_RECETAS, media_type=CONTENT_TYPE_HTML)
    else:
        return HTMLResponse(
            content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
            status_code=HTTP_NOT_FOUND
        )

@app.get("/recetas-guardadas", response_class=HTMLResponse)
def get_recetas_guardadas(request: Request):
    """
    Endpoint para servir la página de recetas guardadas.
    Solo accesible para usuarios autenticados.
    
    Returns:
        FileResponse: Página HTML de recetas guardadas o redirección a página principal
    """
    # Verificar si el usuario está autenticado
    if not es_usuario_registrado(request):
        # Usuario no autenticado: redirigir a página principal
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/", status_code=302)
    
    # Usuario autenticado: servir página de recetas guardadas
    if verificar_archivo_existe(RUTA_RECETAS_GUARDADAS):
        return FileResponse(RUTA_RECETAS_GUARDADAS, media_type=CONTENT_TYPE_HTML)
    else:
        return HTMLResponse(
            content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
            status_code=HTTP_NOT_FOUND
        )

@app.get("/menu-semanal", response_class=HTMLResponse)
def get_menu_semanal(request: Request):
    """
    Endpoint para servir la página del menú semanal.
    Solo accesible para usuarios autenticados.
    
    Returns:
        FileResponse: Página HTML del menú semanal o redirección a página principal
    """
    # Verificar si el usuario está autenticado
    if not es_usuario_registrado(request):
        # Usuario no autenticado: redirigir a página principal
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/", status_code=302)
    
    # Usuario autenticado: servir página del menú semanal
    if verificar_archivo_existe(RUTA_MENU_SEMANAL):
        return FileResponse(RUTA_MENU_SEMANAL, media_type=CONTENT_TYPE_HTML)
    else:
        return HTMLResponse(
            content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
            status_code=HTTP_NOT_FOUND
        )

@app.get("/registrado", response_class=HTMLResponse)
def get_registrado():
    """
    Endpoint para servir la página de usuario registrado/autenticado.
    
    Returns:
        FileResponse: Página HTML de usuario registrado o error 404
    """
    if verificar_archivo_existe(RUTA_USUARIO_REGISTRADO):
        return FileResponse(RUTA_USUARIO_REGISTRADO, media_type=CONTENT_TYPE_HTML)
    else:
        return HTMLResponse(
            content=f"<h1>{MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO}</h1>", 
            status_code=HTTP_NOT_FOUND
        )

@app.get("/api/estado-usuario")
async def obtener_estado_usuario_endpoint(request: Request, response: Response):
    """
    Endpoint simple para obtener el estado del usuario desde JavaScript.
    
    Returns:
        JSONResponse: Estado del usuario (invitado o registrado)
    """
    # Si no hay cookie de estado, establecer como invitado por defecto
    if COOKIE_ESTADO_USUARIO not in request.cookies:
        establecer_estado_usuario(response, ESTADO_INVITADO)
    
    estado = obtener_estado_usuario(request)
    es_registrado = es_usuario_registrado(request)
    
    # Crear la respuesta JSON
    json_response = JSONResponse(content={
        "estado": estado,
        "es_registrado": es_registrado,
        "es_invitado": not es_registrado
    }, status_code=HTTP_OK)
    
    # Si necesitamos establecer cookie, hacerlo en la respuesta final
    if COOKIE_ESTADO_USUARIO not in request.cookies:
        json_response.set_cookie(
            key=COOKIE_ESTADO_USUARIO, 
            value=ESTADO_INVITADO, 
            max_age=86400
        )
    
    return json_response

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
        # Validar contraseña primero
        is_valid_password, error_mensaje = validar_password(cuenta.password)
        if not is_valid_password:
            error_respuesta = {
                "mensaje": error_mensaje,
                "exito": False,
                "codigo_error": "PASSWORD_INVALIDO"
            }
            return JSONResponse(content=error_respuesta, status_code=HTTP_BAD_REQUEST)
        
        # Verificar si el email ya existe
        if email_ya_existe(cuenta.email):
            error_respuesta = {
                "mensaje": MENSAJE_ERROR_EMAIL_DUPLICADO,
                "exito": False,
                "codigo_error": "EMAIL_DUPLICADO"
            }
            return JSONResponse(content=error_respuesta, status_code=HTTP_BAD_REQUEST)
        
        # Convertir la cuenta a diccionario para guardado
        cuenta_data = {
            "nombreUsuario": cuenta.nombreUsuario,
            "email": cuenta.email,
            "password": cuenta.password  # En producción esto debería estar hasheado
        }
        
        # Intentar guardar la cuenta
        if guardar_nueva_cuenta(cuenta_data):
            # Respuesta de éxito
            respuesta = {
                "mensaje": MENSAJE_CUENTA_CREADA,
                "exito": True,
                "usuario_creado": cuenta.nombreUsuario
            }
            return JSONResponse(content=respuesta, status_code=HTTP_CREATED)
        else:
            # Error al guardar
            error_respuesta = {
                "mensaje": "Error al guardar la cuenta",
                "exito": False,
                "codigo_error": "ERROR_GUARDADO"
            }
            return JSONResponse(content=error_respuesta, status_code=HTTP_INTERNAL_SERVER_ERROR)
        
    except Exception as e:        
        # Respuesta de error inesperado
        print(f"{LOG_ERROR} Error inesperado en crear_cuenta: {e}")
        error_respuesta = {
            "mensaje": MENSAJE_ERROR_INTERNO,
            "exito": False,
            "codigo_error": "INTERNAL_ERROR"
        }
        return JSONResponse(content=error_respuesta, status_code=HTTP_INTERNAL_SERVER_ERROR)

@app.post("/iniciar-sesion")
async def iniciar_sesion(login_data: LoginData, response: Response):
    """
    Endpoint para iniciar sesión.

    Args:
        login_data (LoginData): Datos de login (email y password)

    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
        # Validar contraseña primero
        is_valid_password, error_mensaje = validar_password(login_data.password)
        if not is_valid_password:
            error_respuesta = {
                "mensaje": error_mensaje,
                "exito": False,
                "codigo_error": "PASSWORD_INVALIDO"
            }
            return JSONResponse(content=error_respuesta, status_code=HTTP_BAD_REQUEST)
        
        cuenta_existente = validar_cuenta(login_data.email, login_data.password)   

        if (cuenta_existente):
            # Crear respuesta JSON de éxito
            json_response = JSONResponse(content={
                "mensaje": MENSAJE_INICIO_SESION_SATISFACTORIO,
                "exito": True,
                "usuario": login_data.email,
            }, status_code=HTTP_OK)
            
            # Establecer cookie de usuario registrado directamente en la respuesta
            json_response.set_cookie(
                key=COOKIE_ESTADO_USUARIO, 
                value=ESTADO_REGISTRADO, 
                max_age=86400
            )
            
            return json_response
        else:
            respuesta = {
                "mensaje": MENSAJE_INICIO_SESION_NO_SATISFACTORIO,
                "exito": False,
                "usuario": login_data.email,
            }
    
    except Exception as e:
        error_respuesta = {
            "mensaje": MENSAJE_ERROR_INTERNO,
            "exito": False,
            "codigo_error": "INTERNAL_ERROR",
        }
        return JSONResponse(content=error_respuesta, status_code=HTTP_INTERNAL_SERVER_ERROR)

@app.post("/cerrar-sesion")
async def cerrar_sesion(response: Response):
    """
    Endpoint para cerrar sesion.
    
    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
        # Crear respuesta JSON de éxito
        json_response = JSONResponse(content={
            "mensaje": MENSAJE_CUENTA_CERRADA,
            "exito": True,
        }, status_code=HTTP_OK)
        
        # Establecer cookie de usuario invitado (cerrar sesión) directamente en la respuesta
        json_response.set_cookie(
            key=COOKIE_ESTADO_USUARIO, 
            value=ESTADO_INVITADO, 
            max_age=86400
        )
        
        return json_response
        
    except Exception as e:        
        # Respuesta de error (diccionario simple)
        error_respuesta = {
            "mensaje": MENSAJE_ERROR_INTERNO,
            "exito": False,
            "codigo_error": "INTERNAL_ERROR"
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
