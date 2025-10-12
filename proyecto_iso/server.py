"""
Servidor principal de la aplicación web usando FastAPI.
Maneja las rutas y endpoints de la aplicación de recetas con sistema de autenticación basado en cookies.

Características principales:
- Sistema de autenticación con cookies (invitado/registrado)
- Endpoints protegidos que requieren autenticación
- Gestión de cuentas de usuario y recetas
- Validación de formularios y manejo de errores consistente
"""

from typing import Union
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

# Importar módulos locales
from constants import *
from models import Cuenta, LoginData, Receta
from utils import (
    verificar_archivo_existe, guardar_nueva_cuenta, email_ya_existe, 
    validar_cuenta, validar_password, guardar_nueva_receta, obtener_recetas_usuario
)

# ==================== CONFIGURACIÓN DE LA APLICACIÓN ====================

app = FastAPI(
    title="Aplicación Web de Recetas",
    description="API para gestión de recetas y creación de cuentas de usuario con autenticación basada en cookies",
    version="1.0.0",
    docs_url="/docs",  # Documentación Swagger
    redoc_url="/redoc"  # Documentación ReDoc
)

@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    """
    Middleware para añadir cabeceras que evitan el cacheo en el navegador.
    """
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Montar archivos estáticos
app.mount(f"/{DIRECTORIO_STATIC}", StaticFiles(directory=DIRECTORIO_STATIC), name=DIRECTORIO_STATIC)

# ==================== FUNCIONES DE UTILIDAD PARA COOKIES Y AUTENTICACIÓN ====================

def establecer_estado_usuario(response: Response, estado: str) -> None:
    """
    Establece el estado del usuario en una cookie HTTP con configuración anti-cache.
    
    Args:
        response: Objeto Response de FastAPI
        estado: Estado del usuario (ESTADO_INVITADO o ESTADO_REGISTRADO)
    """
    response.set_cookie(
        key=COOKIE_ESTADO_USUARIO, 
        value=estado,
        **COOKIE_CONFIG
    )

def establecer_email_usuario(response: Response, email: str) -> None:
    """
    Establece el email del usuario en una cookie HTTP con configuración anti-cache.
    
    Args:
        response: Objeto Response de FastAPI
        email: Email del usuario registrado
    """
    response.set_cookie(
        key=COOKIE_EMAIL_USUARIO,
        value=email,
        **COOKIE_CONFIG
    )

def eliminar_cookies_usuario(response: Response) -> None:
    """
    Elimina todas las cookies relacionadas con el usuario al cerrar sesión.
    
    Args:
        response: Objeto Response de FastAPI
    """
    response.delete_cookie(key=COOKIE_ESTADO_USUARIO, path="/")
    response.delete_cookie(key=COOKIE_EMAIL_USUARIO, path="/")

def obtener_estado_usuario(request: Request) -> str:
    """
    Obtiene el estado del usuario desde la cookie.
    
    Args:
        request: Objeto Request de FastAPI
        
    Returns:
        Estado del usuario (invitado por defecto si no existe cookie)
    """
    return request.cookies.get(COOKIE_ESTADO_USUARIO, ESTADO_INVITADO)

def obtener_email_usuario(request: Request) -> str:
    """
    Obtiene el email del usuario desde la cookie.
    
    Args:
        request: Objeto Request de FastAPI
        
    Returns:
        Email del usuario registrado (None si no está registrado o no existe cookie)
    """
    if es_usuario_registrado(request):
        return request.cookies.get(COOKIE_EMAIL_USUARIO)
    return None

def es_usuario_registrado(request: Request) -> bool:
    """
    Verifica si el usuario está registrado según la cookie.
    
    Args:
        request: Objeto Request de FastAPI
        
    Returns:
        True si el usuario está registrado, False en caso contrario
    """
    return obtener_estado_usuario(request) == ESTADO_REGISTRADO

def requiere_autenticacion(request: Request) -> Union[None, RedirectResponse]:
    """
    Verifica si el usuario está autenticado y devuelve redirección si no lo está.
    Función helper para eliminar duplicación en endpoints protegidos.
    
    Args:
        request: Objeto Request de FastAPI
        
    Returns:
        None si está autenticado, RedirectResponse si no lo está
    """
    if not es_usuario_registrado(request):
        return RedirectResponse(url="/", status_code=302)
    return None

# ==================== FUNCIONES HELPER PARA RESPUESTAS ====================

def crear_respuesta_exito(mensaje: str, data: dict = None, status_code: int = HTTP_OK) -> JSONResponse:
    """
    Crea una respuesta JSON de éxito estandarizada.
    
    Args:
        mensaje: Mensaje de éxito
        data: Datos adicionales opcionales
        status_code: Código de estado HTTP
        
    Returns:
        JSONResponse con formato estandarizado
    """
    content = {
        "mensaje": mensaje,
        "exito": True
    }
    if data:
        content.update(data)
    
    return JSONResponse(content=content, status_code=status_code)

def crear_respuesta_error(mensaje: str, codigo_error: str = None, status_code: int = HTTP_BAD_REQUEST) -> JSONResponse:
    """
    Crea una respuesta JSON de error estandarizada.
    
    Args:
        mensaje: Mensaje de error
        codigo_error: Código de error específico
        status_code: Código de estado HTTP
        
    Returns:
        JSONResponse con formato estandarizado de error
    """
    content = {
        "mensaje": mensaje,
        "exito": False
    }
    if codigo_error:
        content["codigo_error"] = codigo_error
    
    return JSONResponse(content=content, status_code=status_code)

def servir_pagina_html(ruta_archivo: str, mensaje_error: str = None) -> Union[FileResponse, HTMLResponse]:
    """
    Sirve una página HTML si existe, o devuelve error 404.
    
    Args:
        ruta_archivo: Ruta al archivo HTML
        mensaje_error: Mensaje de error personalizado (opcional)
        
    Returns:
        FileResponse si el archivo existe, HTMLResponse con error 404 si no existe
    """
    if verificar_archivo_existe(ruta_archivo):
        return FileResponse(ruta_archivo, media_type=CONTENT_TYPE_HTML)
    else:
        error_msg = mensaje_error or MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO
        return HTMLResponse(
            content=f"<h1>{error_msg}</h1>", 
            status_code=HTTP_NOT_FOUND
        )

# ==================== ENDPOINTS PÚBLICOS ====================

@app.get("/", response_class=HTMLResponse)
def get_pagina_principal(request: Request, response: Response, logout: bool = False):
    """
    Endpoint para servir la página principal de la aplicación.
    Sirve diferentes páginas según el estado del usuario (invitado o registrado).
    
    Args:
        request: Objeto Request de FastAPI
        response: Objeto Response de FastAPI  
        logout: Si es True, fuerza el estado a invitado (usado después de logout)
    
    Returns:
        FileResponse: Página HTML correspondiente al estado del usuario
    """
    # Establecer cookie por defecto si no existe
    if COOKIE_ESTADO_USUARIO not in request.cookies:
        establecer_estado_usuario(response, ESTADO_INVITADO)
    
    # Verificar el estado actual del usuario desde la cookie
    estado_actual = obtener_estado_usuario(request)
    print(f"🏠 [PÁGINA PRINCIPAL] Estado actual: {estado_actual}, logout param: {logout}")
    
    # Solo aplicar logout si el usuario NO está registrado
    # Esto evita que el parámetro logout interfiera con un login reciente
    if logout and estado_actual != ESTADO_REGISTRADO:
        file_response = FileResponse(RUTA_USUARIO_INVITADO, media_type=CONTENT_TYPE_HTML)
        
        # Eliminar todas las cookies del usuario y establecer como invitado
        eliminar_cookies_usuario(file_response)
        establecer_estado_usuario(file_response, ESTADO_INVITADO)
        
        return file_response
    
    # Servir página según estado del usuario (priorizar cookie sobre parámetro logout)
    if es_usuario_registrado(request):
        return servir_pagina_html(RUTA_USUARIO_REGISTRADO)
    else:
        return servir_pagina_html(RUTA_USUARIO_INVITADO)

@app.get("/registrado", response_class=HTMLResponse)
def get_pagina_registrado():
    """
    Endpoint para servir la página de usuario registrado/autenticado.
    
    Returns:
        FileResponse: Página HTML de usuario registrado
    """
    return servir_pagina_html(RUTA_USUARIO_REGISTRADO)

# ==================== ENDPOINTS PROTEGIDOS (REQUIEREN AUTENTICACIÓN) ====================

@app.get("/perfil", response_class=HTMLResponse)
def get_perfil(request: Request):
    """
    Endpoint para servir la página de perfil.
    Solo accesible para usuarios autenticados.
    
    Returns:
        FileResponse: Página HTML de recetas o redirección si no está autenticado
    """
    # Verificar autenticación
    auth_check = requiere_autenticacion(request)
    if auth_check:
        return auth_check
    
    return servir_pagina_html(RUTA_PERFIL)


@app.get("/recetas", response_class=HTMLResponse)
def get_recetas(request: Request):
    """
    Endpoint para servir la página de recetas.
    Solo accesible para usuarios autenticados.
    
    Returns:
        FileResponse: Página HTML de recetas o redirección si no está autenticado
    """
    # Verificar autenticación
    auth_check = requiere_autenticacion(request)
    if auth_check:
        return auth_check
    
    return servir_pagina_html(RUTA_RECETAS)

@app.get("/mis-recetas", response_class=HTMLResponse)
def get_mis_recetas(request: Request):
    """
    Endpoint para servir la página de mis recetas personales.
    Solo accesible para usuarios autenticados.
    
    Returns:
        FileResponse: Página HTML de mis recetas o redirección si no está autenticado
    """
    # Verificar autenticación
    auth_check = requiere_autenticacion(request)
    if auth_check:
        return auth_check
    
    return servir_pagina_html(RUTA_MIS_RECETAS)

@app.get("/recetas-guardadas", response_class=HTMLResponse) 
def get_recetas_guardadas(request: Request):
    """
    Endpoint para servir la página de recetas guardadas por el usuario.
    Solo accesible para usuarios autenticados.
    
    Returns:
        FileResponse: Página HTML de recetas guardadas o redirección si no está autenticado
    """
    # Verificar autenticación
    auth_check = requiere_autenticacion(request)
    if auth_check:
        return auth_check
    
    return servir_pagina_html(RUTA_RECETAS_GUARDADAS)

@app.get("/menu-semanal", response_class=HTMLResponse)
def get_menu_semanal(request: Request):
    """
    Endpoint para servir la página del menú semanal.
    Solo accesible para usuarios autenticados.
    
    Returns:
        FileResponse: Página HTML del menú semanal o redirección si no está autenticado
    """
    # Verificar autenticación
    auth_check = requiere_autenticacion(request)
    if auth_check:
        return auth_check
    
    return servir_pagina_html(RUTA_MENU_SEMANAL)

# ==================== ENDPOINTS DE AUTENTICACIÓN ====================

@app.post("/iniciar-sesion")
async def iniciar_sesion(login_data: LoginData) -> JSONResponse:
    """
    Endpoint para iniciar sesión de usuario.
    Valida credenciales y establece cookie de usuario registrado si es exitoso.

    Args:
        login_data: Datos de login (email y password)

    Returns:
        JSONResponse: Respuesta con resultado de la operación y cookie establecida
    """
    try:
        print(f"🔍 [LOGIN] Intento de login para: {login_data.email}")
        
        # SEGURIDAD: NO validar formato de contraseña en login
        # Solo verificar si las credenciales coinciden con una cuenta existente
        
        # Validar credenciales contra base de datos
        cuenta_existente = validar_cuenta(login_data.email, login_data.password)   
        print(f"🔍 [LOGIN] Cuenta existente: {cuenta_existente}")

        if cuenta_existente:
            # Éxito: crear respuesta con cookies de usuario registrado
            json_response = crear_respuesta_exito(
                MENSAJE_INICIO_SESION_SATISFACTORIO,
                {"usuario": login_data.email}
            )
            
            # Establecer cookies de autenticación y email
            establecer_estado_usuario(json_response, ESTADO_REGISTRADO)
            establecer_email_usuario(json_response, login_data.email)
            
            print(f"✅ [LOGIN] Login exitoso para {login_data.email}, cookies establecidas")
            return json_response
        else:
            # Credenciales incorrectas
            return crear_respuesta_error(
                MENSAJE_INICIO_SESION_NO_SATISFACTORIO,
                "CREDENCIALES_INCORRECTAS"
            )
    
    except Exception as e:
        # Error interno del servidor
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )

@app.post("/cerrar-sesion")
async def cerrar_sesion() -> JSONResponse:
    """
    Endpoint para cerrar sesión del usuario.
    Cambia la cookie a estado invitado y asegura que no haya caché.
    
    Returns:
        JSONResponse: Respuesta con resultado de la operación y cookie actualizada
    """
    try:
        # Crear respuesta de éxito
        json_response = crear_respuesta_exito(MENSAJE_CUENTA_CERRADA)
        
        # Eliminar cookies del usuario
        eliminar_cookies_usuario(json_response)
        
        # Establecer cookie de invitado (cerrar sesión)
        establecer_estado_usuario(json_response, ESTADO_INVITADO)
        
        print("✅ [LOGOUT] Cookies eliminadas y estado establecido como invitado")
        return json_response
        
    except Exception as e:        
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )

@app.post("/crear-cuenta")
async def crear_cuenta(cuenta: Cuenta) -> JSONResponse:
    """
    Endpoint para crear una nueva cuenta de usuario.
    Valida datos y crea la cuenta si todo es correcto.
    
    Args:
        cuenta: Datos básicos de la cuenta a crear (nombreUsuario, email, password)
        
    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
        # Validar formato de contraseña
        is_valid_password, error_mensaje = validar_password(cuenta.password)
        if not is_valid_password:
            return crear_respuesta_error(error_mensaje, "PASSWORD_INVALIDO")
        
        # Verificar si el email ya existe
        if email_ya_existe(cuenta.email):
            return crear_respuesta_error(
                MENSAJE_ERROR_EMAIL_DUPLICADO,
                "EMAIL_DUPLICADO"
            )
        
        # Preparar datos de la cuenta
        cuenta_data = {
            "nombreUsuario": cuenta.nombreUsuario,
            "email": cuenta.email,
            "password": cuenta.password  # TODO: En producción hashear la contraseña
        }
        
        # Intentar guardar la cuenta
        if guardar_nueva_cuenta(cuenta_data):
            return crear_respuesta_exito(
                MENSAJE_CUENTA_CREADA,
                {"usuario_creado": cuenta.nombreUsuario},
                HTTP_CREATED
            )
        else:
            return crear_respuesta_error(
                "Error al guardar la cuenta",
                "ERROR_GUARDADO",
                HTTP_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:        
        print(f"{LOG_ERROR} Error inesperado en crear_cuenta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )

# ==================== ENDPOINTS DE API ====================

@app.get("/api/estado-usuario")
async def obtener_estado_usuario_api(request: Request, response: Response) -> JSONResponse:
    """
    Endpoint API para consultar el estado del usuario desde JavaScript.
    Establece cookie por defecto si no existe.
    
    Returns:
        JSONResponse: Estado actual del usuario (invitado o registrado)
    """
    # Establecer cookie por defecto si no existe
    if COOKIE_ESTADO_USUARIO not in request.cookies:
        establecer_estado_usuario(response, ESTADO_INVITADO)
    
    estado = obtener_estado_usuario(request)
    es_registrado = es_usuario_registrado(request)
    
    # Obtener email del usuario si está registrado
    email_usuario = obtener_email_usuario(request) if es_registrado else None
    
    # Crear respuesta con información del estado
    json_response = JSONResponse(content={
        "estado": estado,
        "es_registrado": es_registrado,
        "es_invitado": not es_registrado,
        "email_usuario": email_usuario
    }, status_code=HTTP_OK)
    
    # Establecer cookie si no existía
    if COOKIE_ESTADO_USUARIO not in request.cookies:
        establecer_estado_usuario(json_response, ESTADO_INVITADO)
    
    return json_response

# ==================== ENDPOINTS DE FUNCIONALIDADES ESPECÍFICAS ====================

@app.post("/crear-receta")
async def crear_receta(receta: Receta, request: Request) -> JSONResponse:
    """
    Endpoint para crear una nueva receta de cocina.
    Solo accesible para usuarios autenticados.
    
    Args:
        receta: Datos de la receta a crear (nombre, descripción, ingredientes, etc.)
        request: Objeto Request de FastAPI para obtener cookies

    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para crear recetas",
                "USUARIO_NO_AUTENTICADO",
                HTTP_BAD_REQUEST
            )
        
        # Obtener email del usuario desde la cookie
        email_usuario = obtener_email_usuario(request)
        if not email_usuario:
            return crear_respuesta_error(
                "No se pudo identificar al usuario",
                "EMAIL_NO_ENCONTRADO",
                HTTP_BAD_REQUEST
            )
        
        print(f"🍳 [CREAR RECETA] Usuario {email_usuario} creando receta '{receta.nombreReceta}'")
        
        # Convertir modelo Pydantic a diccionario para facilitar el manejo
        receta_data = receta.model_dump()
        
        # Guardar la receta con el email del usuario
        if guardar_nueva_receta(receta_data, email_usuario):
            return crear_respuesta_exito(
                MENSAJE_RECETA_CREADA,
                {
                    "receta_creada": receta.nombreReceta,
                    "usuario": email_usuario
                }
            )
        else:
            return crear_respuesta_error(
                "Error al guardar la receta",
                "ERROR_GUARDADO",
                HTTP_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:        
        print(f"{LOG_ERROR} Error inesperado en crear_receta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )

@app.get("/api/mis-recetas")
async def obtener_mis_recetas(request: Request) -> JSONResponse:
    """
    Endpoint API para obtener todas las recetas del usuario autenticado.
    
    Args:
        request: Objeto Request de FastAPI para obtener cookies
        
    Returns:
        JSONResponse: Lista de recetas del usuario
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para ver tus recetas",
                "USUARIO_NO_AUTENTICADO",
                HTTP_BAD_REQUEST
            )
        
        # Obtener email del usuario desde la cookie
        email_usuario = obtener_email_usuario(request)
        if not email_usuario:
            return crear_respuesta_error(
                "No se pudo identificar al usuario",
                "EMAIL_NO_ENCONTRADO",
                HTTP_BAD_REQUEST
            )
        
        # Obtener recetas del usuario
        recetas_usuario = obtener_recetas_usuario(email_usuario)
        
        return crear_respuesta_exito(
            f"Recetas obtenidas correctamente",
            {
                "recetas": recetas_usuario,
                "total": len(recetas_usuario),
                "usuario": email_usuario
            }
        )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en obtener_mis_recetas: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )
