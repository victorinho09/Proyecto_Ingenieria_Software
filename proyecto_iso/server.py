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
    validar_cuenta, validar_password, guardar_nueva_receta, obtener_recetas_usuario,
    procesar_imagen_receta, guardar_receta_usuario, desguardar_receta_usuario,
    obtener_recetas_guardadas_usuario, es_receta_guardada_por_usuario, obtener_receta_por_id,
    obtener_recetas_usuario_con_ids, cargar_recetas, guardar_recetas, publicar_receta_usuario
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

@app.get("/comunidad", response_class=HTMLResponse)
def get_comunidad(request: Request):
    """
    Endpoint para servir la página de comunidad.
    Solo accesible para usuarios autenticados.
    
    Returns:
        FileResponse: Página HTML de recetas o redirección si no está autenticado
    """
    # Verificar autenticación
    auth_check = requiere_autenticacion(request)
    if auth_check:
        return auth_check
    
    return servir_pagina_html(RUTA_COMUNIDAD)

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
        
        # Procesar imagen Base64 si existe
        receta_data = procesar_imagen_receta(receta_data, email_usuario)
        
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
        
        # Obtener recetas del usuario con IDs únicos
        recetas_usuario = obtener_recetas_usuario_con_ids(email_usuario)
        
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


@app.get("/api/recetas-comunidad")
async def obtener_recetas_comunidad(request: Request) -> JSONResponse:
    """
    Endpoint API para obtener todas las recetas publicadas de otros usuarios (comunidad).
    Solo incluye recetas marcadas como publicadas y excluye las del usuario autenticado.
    
    Args:
        request: Objeto Request de FastAPI para obtener cookies
        
    Returns:
        JSONResponse: Lista de recetas publicadas de la comunidad (excluyendo las del usuario)
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para ver las recetas de la comunidad",
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
        
        # Cargar todas las recetas del sistema
        todas_recetas = cargar_recetas()
        
        # Filtrar las recetas: solo incluir las publicadas de otros usuarios
        recetas_comunidad = []
        for idx, receta in enumerate(todas_recetas):
            # Solo incluir recetas publicadas de otros usuarios
            if (receta.get("usuario", "") != email_usuario and 
                receta.get("publicada", False) == True):
                receta_con_id = receta.copy()
                receta_con_id["id"] = f"receta-{idx}"
                recetas_comunidad.append(receta_con_id)
        
        return crear_respuesta_exito(
            f"Recetas de la comunidad obtenidas correctamente",
            {
                "recetas": recetas_comunidad,
                "total": len(recetas_comunidad),
                "usuario": email_usuario
            }
        )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en obtener_recetas_comunidad: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )


@app.get("/api/receta/{receta_id}")
async def obtener_detalle_receta(receta_id: str, request: Request) -> JSONResponse:
    """
    Obtiene los detalles completos de una receta específica.
    Permite ver tanto recetas propias como de otros usuarios.
    Acepta dos formatos de ID:
    - "receta-{idx}": índice directo en el array de recetas
    - Base64 encoded: nombre de receta codificado en base64
    
    Args:
        receta_id (str): ID único de la receta
        request (Request): Objeto Request de FastAPI con cookies de sesión
        
    Returns:
        JSONResponse: Respuesta con los datos completos de la receta o error
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para ver los detalles de las recetas",
                "USUARIO_NO_AUTENTICADO",
                HTTP_BAD_REQUEST
            )
        
        # Obtener email del usuario
        email_usuario = obtener_email_usuario(request)
        if not email_usuario:
            return crear_respuesta_error(
                "No se pudo identificar al usuario",
                "EMAIL_NO_ENCONTRADO",
                HTTP_BAD_REQUEST
            )
        
        # Cargar todas las recetas
        todas_recetas = cargar_recetas()
        
        receta_encontrada = None
        
        # Intentar primero con el formato "receta-{idx}"
        if receta_id.startswith("receta-"):
            try:
                idx = int(receta_id.replace("receta-", ""))
                if 0 <= idx < len(todas_recetas):
                    receta_encontrada = todas_recetas[idx].copy()
                    receta_encontrada["id"] = receta_id
            except ValueError:
                pass
        
        # Si no se encontró, intentar decodificar base64
        if receta_encontrada is None:
            try:
                import urllib.parse
                import base64
                # Decodificar el ID para obtener el nombre de la receta
                nombre_receta = base64.b64decode(urllib.parse.unquote(receta_id)).decode('utf-8')
                
                # Buscar la receta por nombre
                for idx, receta in enumerate(todas_recetas):
                    if receta.get("nombreReceta", "") == nombre_receta:
                        receta_encontrada = receta.copy()
                        receta_encontrada["id"] = receta_id
                        break
            except Exception:
                pass
        
        # Si no se encontró la receta con ninguno de los dos métodos
        if receta_encontrada is None:
            return crear_respuesta_error(
                "Receta no encontrada",
                "RECETA_NO_ENCONTRADA",
                HTTP_NOT_FOUND
            )
        
        # Verificar si el usuario tiene esta receta guardada
        nombre_receta = receta_encontrada.get("nombreReceta", "")
        receta_guardada = es_receta_guardada_por_usuario(nombre_receta, email_usuario)
        
        return crear_respuesta_exito(
            f"Detalles de receta obtenidos correctamente",
            {
                "receta": receta_encontrada,
                "usuario": email_usuario,
                "guardada": receta_guardada
            }
        )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en obtener_detalle_receta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )


# ==================== ENDPOINTS DE RECETAS GUARDADAS ====================

@app.post("/guardar-receta")
async def guardar_receta(request: Request) -> JSONResponse:
    """
    Endpoint para guardar una receta en la lista personal del usuario.
    Solo accesible para usuarios autenticados.
    
    Args:
        request: Objeto Request de FastAPI para obtener cookies y datos

    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para guardar recetas",
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
        
        # Obtener datos del cuerpo de la petición
        body = await request.json()
        nombre_receta = body.get("nombreReceta")
        
        if not nombre_receta:
            return crear_respuesta_error(
                "El nombre de la receta es obligatorio",
                "NOMBRE_RECETA_REQUERIDO",
                HTTP_BAD_REQUEST
            )
        
        print(f"🔖 [GUARDAR RECETA] Usuario {email_usuario} guardando receta '{nombre_receta}'")
        
        # Guardar la receta para el usuario
        if guardar_receta_usuario(nombre_receta, email_usuario):
            return crear_respuesta_exito(
                f"Receta '{nombre_receta}' guardada correctamente",
                {"nombreReceta": nombre_receta, "guardada": True}
            )
        else:
            return crear_respuesta_error(
                "No se pudo guardar la receta",
                "ERROR_GUARDAR_RECETA",
                HTTP_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en guardar_receta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )


@app.post("/desguardar-receta")
async def desguardar_receta(request: Request) -> JSONResponse:
    """
    Endpoint para desguardar una receta de la lista personal del usuario.
    Solo accesible para usuarios autenticados.
    
    Args:
        request: Objeto Request de FastAPI para obtener cookies y datos

    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para desguardar recetas",
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
        
        # Obtener datos del cuerpo de la petición
        body = await request.json()
        nombre_receta = body.get("nombreReceta")
        
        if not nombre_receta:
            return crear_respuesta_error(
                "El nombre de la receta es obligatorio",
                "NOMBRE_RECETA_REQUERIDO",
                HTTP_BAD_REQUEST
            )
        
        print(f"🗑️ [DESGUARDAR RECETA] Usuario {email_usuario} desguardando receta '{nombre_receta}'")
        
        # Desguardar la receta para el usuario
        if desguardar_receta_usuario(nombre_receta, email_usuario):
            return crear_respuesta_exito(
                f"Receta '{nombre_receta}' desguardada correctamente",
                {"nombreReceta": nombre_receta, "guardada": False}
            )
        else:
            return crear_respuesta_error(
                "No se pudo desguardar la receta",
                "ERROR_DESGUARDAR_RECETA",
                HTTP_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en desguardar_receta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )


@app.post("/eliminar-receta")
async def eliminar_receta(request: Request) -> JSONResponse:
    """
    Elimina una receta del sistema. Solo el autor de la receta puede eliminarla.
    Al eliminarla, la receta desaparece de la lista global, de la comunidad y de las listas guardadas de otros usuarios.
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para eliminar recetas",
                "USUARIO_NO_AUTENTICADO",
                HTTP_BAD_REQUEST
            )

        # Obtener email del usuario
        email_usuario = obtener_email_usuario(request)
        if not email_usuario:
            return crear_respuesta_error(
                "No se pudo identificar al usuario",
                "EMAIL_NO_ENCONTRADO",
                HTTP_BAD_REQUEST
            )

        body = await request.json()
        nombre_receta = body.get("nombreReceta") or body.get("recetaId")

        if not nombre_receta:
            return crear_respuesta_error(
                "El nombre o ID de la receta es obligatorio",
                "NOMBRE_RECETA_REQUERIDO",
                HTTP_BAD_REQUEST
            )

        print(f"🗑️ [ELIMINAR RECETA] Usuario {email_usuario} solicitando eliminar '{nombre_receta}'")

        # Cargar todas las recetas
        recetas = cargar_recetas()

        # Buscar receta por nombre exacto y autor
        receta_encontrada = False
        for idx, receta in enumerate(recetas):
            if receta.get("nombreReceta") == nombre_receta and receta.get("usuario") == email_usuario:
                receta_encontrada = True
                # Eliminar la receta
                recetas.pop(idx)
                # Guardar cambios
                if guardar_recetas(recetas):
                    print(f"✅ Receta '{nombre_receta}' eliminada por {email_usuario}")
                    return crear_respuesta_exito(
                        f"Receta '{nombre_receta}' eliminada correctamente",
                        {"nombreReceta": nombre_receta}
                    )
                else:
                    return crear_respuesta_error(
                        "Error al guardar cambios tras eliminar la receta",
                        "ERROR_GUARDAR",
                        HTTP_INTERNAL_SERVER_ERROR
                    )

        if not receta_encontrada:
            return crear_respuesta_error(
                "Receta no encontrada o no tienes permisos para eliminarla",
                "RECETA_NO_ENCONTRADA_O_SIN_PERMISOS",
                HTTP_NOT_FOUND
            )

    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en eliminar_receta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )


@app.post("/publicar-receta")
async def publicar_receta(request: Request) -> JSONResponse:
    """
    Endpoint para publicar una receta en la comunidad.
    Solo el autor de la receta puede publicarla.
    
    Args:
        request: Objeto Request de FastAPI para obtener cookies y datos

    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para publicar recetas",
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
        
        # Obtener datos del cuerpo de la petición
        body = await request.json()
        receta_id = body.get("recetaId")
        
        if not receta_id:
            return crear_respuesta_error(
                "El ID de la receta es obligatorio",
                "ID_RECETA_REQUERIDO",
                HTTP_BAD_REQUEST
            )
        
        print(f"📢 [PUBLICAR RECETA] Usuario {email_usuario} publicando receta ID '{receta_id}'")
        
        # Publicar la receta
        if publicar_receta_usuario(receta_id, email_usuario):
            return crear_respuesta_exito(
                "Receta publicada en la comunidad correctamente",
                {"recetaId": receta_id, "publicada": True}
            )
        else:
            return crear_respuesta_error(
                "No se pudo publicar la receta. Verifica que seas el autor de la receta.",
                "ERROR_PUBLICAR_RECETA",
                HTTP_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en publicar_receta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )


@app.get("/obtener-recetas-guardadas")
async def obtener_recetas_guardadas(request: Request) -> JSONResponse:
    """
    Endpoint para obtener todas las recetas guardadas por el usuario autenticado.
    Solo accesible para usuarios autenticados.
    
    Args:
        request: Objeto Request de FastAPI para obtener cookies

    Returns:
        JSONResponse: Respuesta con las recetas guardadas del usuario
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para ver tus recetas guardadas",
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
        
        # Obtener recetas guardadas del usuario
        recetas_guardadas = obtener_recetas_guardadas_usuario(email_usuario)
        
        # Filtrar para excluir las recetas del propio usuario
        recetas_guardadas_otros = [
            receta for receta in recetas_guardadas 
            if receta.get("usuario", "") != email_usuario
        ]
        
        # Cargar todas las recetas para obtener el índice real
        todas_recetas = cargar_recetas()
        
        # Agregar IDs a las recetas usando el índice del array completo
        for receta in recetas_guardadas_otros:
            # Buscar el índice real de esta receta en el array completo
            for idx, receta_completa in enumerate(todas_recetas):
                if receta_completa.get("nombreReceta") == receta.get("nombreReceta"):
                    receta["id"] = f"receta-{idx}"
                    break
        
        return crear_respuesta_exito(
            f"Recetas guardadas obtenidas correctamente",
            {
                "recetas": recetas_guardadas_otros,
                "total": len(recetas_guardadas_otros),
                "usuario": email_usuario
            }
        )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en obtener_recetas_guardadas: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )
