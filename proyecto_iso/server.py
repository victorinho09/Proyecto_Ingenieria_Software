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
import os
import uuid
from fastapi import FastAPI, Request, Response
from fastapi import UploadFile, File
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

# Importar módulos locales
from constants import *
from models import Cuenta, LoginData, Receta, ComentarioRequest, ValoracionRequest
from utils import (
    verificar_archivo_existe, guardar_nueva_cuenta, email_ya_existe, 
    validar_cuenta, validar_password, guardar_nueva_receta, obtener_recetas_usuario,
    procesar_imagen_receta, guardar_receta_usuario, desguardar_receta_usuario,
    obtener_recetas_guardadas_usuario, es_receta_guardada_por_usuario, obtener_receta_por_id,
    obtener_recetas_usuario_con_ids, cargar_recetas, guardar_recetas, publicar_receta_usuario,
    cargar_cuentas, hash_password
)
from utils import obtener_cuenta_por_email, actualizar_cuenta, crear_directorio_si_no_existe, generar_nombre_archivo_unico, obtener_extension_desde_mime

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
            
        # Validar el email usando la API
        from email_validator_service import verificar_email_api
        is_valid_email, mensaje_validacion = await verificar_email_api(cuenta.email)
        if not is_valid_email:
            return crear_respuesta_error(mensaje_validacion, "EMAIL_INVALIDO")
        
        
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


@app.get("/api/perfil")
async def obtener_perfil_api(request: Request) -> JSONResponse:
    """
    Devuelve información resumida del perfil del usuario autenticado:
    - email
    - nombreUsuario
    - fotoPerfil (URL si existe)
    - total de recetas propias
    - total de recetas publicadas
    - total de recetas guardadas
    - total de recetas marcadas como hechas por el usuario (usuariosHecho)
    """
    try:
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para ver el perfil",
                "USUARIO_NO_AUTENTICADO",
                HTTP_BAD_REQUEST
            )

        email = obtener_email_usuario(request)
        if not email:
            return crear_respuesta_error(
                "No se pudo identificar al usuario",
                "EMAIL_NO_ENCONTRADO",
                HTTP_BAD_REQUEST
            )

        # Obtener cuenta para nombre de usuario y foto
        cuenta = obtener_cuenta_por_email(email)
        nombre_usuario = cuenta.get('nombreUsuario') if cuenta else None
        foto_perfil = cuenta.get('fotoPerfil') if cuenta else None

        # Contar recetas propias y publicadas
        todas_recetas = cargar_recetas()
        recetas_propias = [r for r in todas_recetas if r.get('usuario', '').lower() == email.lower()]
        total_propias = len(recetas_propias)
        total_publicadas = sum(1 for r in recetas_propias if r.get('publicada', False) == True)

        # Recetas guardadas
        recetas_guardadas = obtener_recetas_guardadas_usuario(email)
        total_guardadas = len(recetas_guardadas)

        # Recetas hechas: Para que coincida con el contador de "Mis Recetas",
        # reutilizamos la misma función que el endpoint /api/mis-recetas
        recetas_usuario_ids = obtener_recetas_usuario_con_ids(email)
        total_hechas = len(recetas_usuario_ids)

        # Calcular la valoración agregada del usuario (media ponderada por número de valoraciones)
        try:
            suma_puntos = 0
            total_valoraciones = 0
            for r in recetas_propias:
                # Solo considerar las recetas publicadas
                if not r.get('publicada', False):
                    continue
                vals = r.get('valoraciones', []) or []
                for v in vals:
                    try:
                        suma_puntos += float(v.get('puntuacion', 0))
                        total_valoraciones += 1
                    except Exception:
                        continue

            valoracion_perfil = round((suma_puntos / total_valoraciones), 1) if total_valoraciones > 0 else 0.0
            # Persistir valoracion y el contador de valoraciones en la cuenta (si se puede)
            try:
                actualizar_cuenta(email, {"valoracion": valoracion_perfil, "valoracion_count": total_valoraciones})
            except Exception as e:
                print(f"{LOG_WARNING} No se pudo actualizar la cuenta con la valoración: {e}")
        except Exception as e:
            print(f"{LOG_ERROR} Error calculando valoración del perfil: {e}")
            valoracion_perfil = 0.0

        data = {
            "email": email,
            "nombreUsuario": nombre_usuario,
            "fotoPerfil": foto_perfil,
            "totalPropias": total_propias,
            "totalPublicadas": total_publicadas,
            "totalGuardadas": total_guardadas,
            "totalHechas": total_hechas
        }

        # Añadir valoracion almacenada en la cuenta (si existe) o la calculada
        cuenta = obtener_cuenta_por_email(email)
        if cuenta and 'valoracion' in cuenta:
            data['valoracion'] = cuenta.get('valoracion', valoracion_perfil)
        else:
            data['valoracion'] = valoracion_perfil

        # Añadir también el contador de valoraciones si está disponible
        if cuenta and 'valoracion_count' in cuenta:
            try:
                data['valoracion_count'] = int(cuenta.get('valoracion_count', 0))
            except Exception:
                data['valoracion_count'] = 0
        else:
            try:
                data['valoracion_count'] = int(total_valoraciones)
            except Exception:
                data['valoracion_count'] = 0

        return crear_respuesta_exito("Perfil obtenido correctamente", {"perfil": data})

    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en obtener_perfil_api: {e}")
        return crear_respuesta_error(MENSAJE_ERROR_INTERNO, "INTERNAL_ERROR", HTTP_INTERNAL_SERVER_ERROR)


@app.post("/api/subir-foto-perfil")
async def subir_foto_perfil(request: Request, archivo: UploadFile = File(...)) -> JSONResponse:
    """
    Endpoint para subir la foto de perfil del usuario autenticado.
    Guarda la imagen en `static/uploads/perfiles/` y actualiza la cuenta.
    """
    try:
        if not es_usuario_registrado(request):
            return crear_respuesta_error("Debes estar registrado para subir foto", "USUARIO_NO_AUTENTICADO", HTTP_BAD_REQUEST)

        email = obtener_email_usuario(request)
        if not email:
            return crear_respuesta_error("No se pudo identificar al usuario", "EMAIL_NO_ENCONTRADO", HTTP_BAD_REQUEST)

        # Validar tipo y extensión
        if archivo.content_type not in TIPOS_IMAGEN_PERMITIDOS:
            return crear_respuesta_error("Tipo de imagen no permitido", "TIPO_IMAGEN_NO_PERMITIDO", HTTP_BAD_REQUEST)

        # Crear directorio de perfiles usando la misma lógica que para recetas
        perfiles_dir = os.path.join(DIRECTORIO_UPLOADS, "perfiles")
        crear_directorio_si_no_existe(DIRECTORIO_UPLOADS)
        crear_directorio_si_no_existe(perfiles_dir)

        # Determinar extensión a partir del content_type usando helper
        ext = obtener_extension_desde_mime(archivo.content_type or "image/png")

        # Generar nombre de archivo único consistente con recetas
        nombre_archivo = generar_nombre_archivo_unico(email, ext)
        ruta_guardado = os.path.join(perfiles_dir, nombre_archivo)

        # Guardar archivo y validar tamaño
        contenido = await archivo.read()
        if len(contenido) > TAMAÑO_MAXIMO_IMAGEN:
            return crear_respuesta_error("Imagen demasiado grande", "IMAGEN_TAMANIO_EXCEDIDO", HTTP_BAD_REQUEST)

        with open(ruta_guardado, 'wb') as f:
            f.write(contenido)

        # URL accesible (misma base que recetas pero carpeta 'perfiles')
        url_publica = f"/static/uploads/perfiles/{nombre_archivo}"

        # Actualizar cuenta
        if actualizar_cuenta(email, {"fotoPerfil": url_publica}):
            return crear_respuesta_exito("Foto de perfil subida correctamente", {"fotoPerfil": url_publica})
        else:
            return crear_respuesta_error("No se pudo actualizar la cuenta con la foto", "ERROR_ACTUALIZAR_CUENTA", HTTP_INTERNAL_SERVER_ERROR)

    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en subir_foto_perfil: {e}")
        return crear_respuesta_error(MENSAJE_ERROR_INTERNO, "INTERNAL_ERROR", HTTP_INTERNAL_SERVER_ERROR)


@app.post('/api/actualizar-usuario')
async def api_actualizar_usuario(request: Request) -> JSONResponse:
    """
    Actualiza campos de la cuenta del usuario autenticado. Actualmente soporta:
    - nombreUsuario
    Recibe JSON: { "nombreUsuario": "NuevoNombre" }
    """
    try:
        if not es_usuario_registrado(request):
            return crear_respuesta_error("Debes estar registrado para actualizar tu usuario", "USUARIO_NO_AUTENTICADO", HTTP_BAD_REQUEST)

        payload = await request.json()
        nuevo_nombre = payload.get('nombreUsuario')
        if not nuevo_nombre or not isinstance(nuevo_nombre, str):
            return crear_respuesta_error("Nombre de usuario inválido", "NOMBRE_INVALIDO", HTTP_BAD_REQUEST)

        email = obtener_email_usuario(request)
        if not email:
            return crear_respuesta_error("No se pudo identificar al usuario", "EMAIL_NO_ENCONTRADO", HTTP_BAD_REQUEST)

        # Actualizar en el archivo de cuentas
        if actualizar_cuenta(email, {"nombreUsuario": nuevo_nombre}):
            return crear_respuesta_exito("Nombre de usuario actualizado", {"nombreUsuario": nuevo_nombre})
        else:
            return crear_respuesta_error("No se pudo actualizar la cuenta", "ERROR_ACTUALIZAR_CUENTA", HTTP_INTERNAL_SERVER_ERROR)

    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en api_actualizar_usuario: {e}")
        return crear_respuesta_error(MENSAJE_ERROR_INTERNO, "INTERNAL_ERROR", HTTP_INTERNAL_SERVER_ERROR)


@app.post('/api/cambiar-password')
async def api_cambiar_password(request: Request) -> JSONResponse:
    """
    Endpoint para cambiar la contraseña del usuario autenticado.
    JSON esperado: { currentPassword: str, newPassword: str, confirmPassword: str }
    Se verifica la contraseña actual, se valida la nueva y se actualiza en el archivo de cuentas.
    """
    try:
        if not es_usuario_registrado(request):
            return crear_respuesta_error("Debes estar registrado para cambiar la contraseña", "USUARIO_NO_AUTENTICADO", HTTP_BAD_REQUEST)

        payload = await request.json()
        current = payload.get('currentPassword')
        new = payload.get('newPassword')
        confirm = payload.get('confirmPassword')

        if not current or not new or not confirm:
            return crear_respuesta_error("Rellena todos los campos", "CAMPOS_INCOMPLETOS", HTTP_BAD_REQUEST)

        if new != confirm:
            return crear_respuesta_error("La nueva contraseña y la confirmación no coinciden", "PASSWORD_CONFIRMACION", HTTP_BAD_REQUEST)

        email = obtener_email_usuario(request)
        if not email:
            return crear_respuesta_error("No se pudo identificar al usuario", "EMAIL_NO_ENCONTRADO", HTTP_BAD_REQUEST)

        # Verificar que la contraseña actual coincide
        if not validar_cuenta(email, current):
            return crear_respuesta_error("La contraseña actual es incorrecta", "PASSWORD_ACTUAL_INVALIDA", HTTP_BAD_REQUEST)

        # La nueva contraseña no puede ser igual a la actual
        if current == new:
            return crear_respuesta_error("La nueva contraseña no puede ser igual a la actual", "PASSWORD_IGUAL_ACTUAL", HTTP_BAD_REQUEST)

        # Validar nueva contraseña
        is_valid, mensaje_validacion = validar_password(new)
        if not is_valid:
            return crear_respuesta_error(mensaje_validacion, "PASSWORD_INVALIDO", HTTP_BAD_REQUEST)

        # Actualizar cuenta (guardar contraseña hasheada si es posible)
        pwd_to_store = hash_password(new) if 'hash_password' in globals() else new
        if actualizar_cuenta(email, {"password": pwd_to_store}):
            return crear_respuesta_exito("Contraseña actualizada correctamente")
        else:
            return crear_respuesta_error("No se pudo actualizar la contraseña", "ERROR_ACTUALIZAR_CUENTA", HTTP_INTERNAL_SERVER_ERROR)

    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en api_cambiar_password: {e}")
        return crear_respuesta_error(MENSAJE_ERROR_INTERNO, "INTERNAL_ERROR", HTTP_INTERNAL_SERVER_ERROR)

# ==================== ENDPOINTS DE FUNCIONALIDADES ESPECÍFICAS ====================

@app.post("/crear-receta")
async def crear_receta(receta: Receta, request: Request) -> JSONResponse:
    """
    Endpoint para crear o editar una receta de cocina.
    Solo accesible para usuarios autenticados.
    
    Args:
        receta: Datos de la receta a crear o editar
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
        
        # Convertir modelo Pydantic a diccionario
        receta_data = receta.model_dump()
        
        # Determinar si es modo edición
        es_edicion = receta_data.get("modoEdicion", "false").lower() == "true"
        nombre_original = receta_data.get("nombreRecetaOriginal", "")
        
        # Eliminar campos de control antes de procesar
        receta_data.pop("modoEdicion", None)
        receta_data.pop("nombreRecetaOriginal", None)
        
        # Procesar imagen Base64 si existe
        receta_data = procesar_imagen_receta(receta_data, email_usuario)
        
        if es_edicion and nombre_original:
            # MODO EDICIÓN: Actualizar receta existente
            print(f"✏️ [EDITAR RECETA] Usuario {email_usuario} editando receta '{nombre_original}' → '{receta.nombreReceta}'")
            
            # Cargar todas las recetas
            todas_recetas = cargar_recetas()
            
            # Buscar la receta original del usuario
            receta_encontrada = False
            for i, receta_existente in enumerate(todas_recetas):
                if (receta_existente.get("nombreReceta") == nombre_original and 
                    receta_existente.get("usuario", "").lower() == email_usuario.lower()):
                    
                    # Mantener los usuarios que guardaron la receta
                    receta_data["usuariosGuardado"] = receta_existente.get("usuariosGuardado", [])
                    
                    # Actualizar la receta manteniendo el usuario
                    receta_data["usuario"] = email_usuario
                    todas_recetas[i] = receta_data
                    receta_encontrada = True
                    break
            
            if not receta_encontrada:
                return crear_respuesta_error(
                    "No se encontró la receta a editar",
                    "RECETA_NO_ENCONTRADA",
                    HTTP_BAD_REQUEST
                )
            
            # Guardar todas las recetas con la modificación
            if guardar_recetas(todas_recetas):
                return crear_respuesta_exito(
                    "Receta actualizada correctamente",
                    {
                        "receta_actualizada": receta.nombreReceta,
                        "usuario": email_usuario
                    }
                )
            else:
                return crear_respuesta_error(
                    "Error al actualizar la receta",
                    "ERROR_GUARDADO",
                    HTTP_INTERNAL_SERVER_ERROR
                )
        else:
            # MODO CREACIÓN: Nueva receta
            print(f"🍳 [CREAR RECETA] Usuario {email_usuario} creando receta '{receta.nombreReceta}'")
            
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


@app.post("/api/comentar-receta")
async def comentar_receta(comentario_data: ComentarioRequest, request: Request) -> JSONResponse:
    """
    Endpoint para añadir un comentario a una receta.
    Solo usuarios autenticados pueden comentar.
    
    Args:
        comentario_data: Datos del comentario (nombreReceta, texto)
        request: Objeto Request de FastAPI para obtener cookies

    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para comentar recetas",
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
        
        # Validar que el comentario no esté vacío
        if not comentario_data.texto or comentario_data.texto.strip() == "":
            return crear_respuesta_error(
                "El comentario no puede estar vacío",
                "COMENTARIO_VACIO",
                HTTP_BAD_REQUEST
            )
        
        # Validar longitud del comentario (máximo 500 caracteres)
        if len(comentario_data.texto) > 500:
            return crear_respuesta_error(
                "El comentario no puede exceder los 500 caracteres",
                "COMENTARIO_MUY_LARGO",
                HTTP_BAD_REQUEST
            )
        
        print(f"💬 [COMENTAR RECETA] Usuario {email_usuario} comentando en '{comentario_data.nombreReceta}'")
        
        # Cargar recetas
        recetas = cargar_recetas()
        
        # Buscar la receta
        receta_encontrada = False
        for receta in recetas:
            if receta.get("nombreReceta") == comentario_data.nombreReceta:
                receta_encontrada = True
                
                # Crear el comentario
                from datetime import datetime
                nuevo_comentario = {
                    "usuario": email_usuario,
                    "texto": comentario_data.texto.strip(),
                    "fecha": datetime.now().isoformat()
                }
                
                # Inicializar la lista de comentarios si no existe
                if "comentarios" not in receta:
                    receta["comentarios"] = []
                
                # Añadir el comentario
                receta["comentarios"].append(nuevo_comentario)
                
                # Guardar cambios
                if guardar_recetas(recetas):
                    print(f"✅ Comentario añadido por {email_usuario} en '{comentario_data.nombreReceta}'")
                    return crear_respuesta_exito(
                        "Comentario publicado correctamente",
                        {
                            "comentario": nuevo_comentario,
                            "totalComentarios": len(receta["comentarios"])
                        }
                    )
                else:
                    return crear_respuesta_error(
                        "Error al guardar el comentario",
                        "ERROR_GUARDAR",
                        HTTP_INTERNAL_SERVER_ERROR
                    )
        
        if not receta_encontrada:
            return crear_respuesta_error(
                "Receta no encontrada",
                "RECETA_NO_ENCONTRADA",
                HTTP_NOT_FOUND
            )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en comentar_receta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )


@app.get("/api/comentarios-receta/{receta_id}")
async def obtener_comentarios_receta(receta_id: str, request: Request) -> JSONResponse:
    """
    Endpoint para obtener todos los comentarios de una receta.
    
    Args:
        receta_id: ID de la receta (formato: receta-{index})
        request: Objeto Request de FastAPI

    Returns:
        JSONResponse: Respuesta con los comentarios de la receta
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para ver comentarios",
                "USUARIO_NO_AUTENTICADO",
                HTTP_BAD_REQUEST
            )
        
        print(f"📖 [OBTENER COMENTARIOS] Obteniendo comentarios para receta ID '{receta_id}'")
        
        # Extraer el índice del ID
        try:
            index = int(receta_id.replace("receta-", ""))
        except ValueError:
            return crear_respuesta_error(
                "ID de receta inválido",
                "ID_INVALIDO",
                HTTP_BAD_REQUEST
            )
        
        # Cargar recetas
        recetas = cargar_recetas()
        
        # Verificar que el índice sea válido
        if index < 0 or index >= len(recetas):
            return crear_respuesta_error(
                "Receta no encontrada",
                "RECETA_NO_ENCONTRADA",
                HTTP_NOT_FOUND
            )
        
        receta = recetas[index]
        comentarios = receta.get("comentarios", [])
        
        return crear_respuesta_exito(
            "Comentarios obtenidos correctamente",
            {
                "comentarios": comentarios,
                "total": len(comentarios),
                "nombreReceta": receta.get("nombreReceta")
            }
        )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en obtener_comentarios_receta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )


@app.post("/api/valorar-receta")
async def valorar_receta(valoracion_data: ValoracionRequest, request: Request) -> JSONResponse:
    """
    Endpoint para añadir o actualizar una valoración a una receta.
    Solo usuarios autenticados pueden valorar.
    Un usuario solo puede tener una valoración por receta (se actualiza si ya existe).
    
    Args:
        valoracion_data: Datos de la valoración (nombreReceta, puntuacion)
        request: Objeto Request de FastAPI para obtener cookies

    Returns:
        JSONResponse: Respuesta con el resultado de la operación
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para valorar recetas",
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
        
        # Validar puntuación (1-5)
        if valoracion_data.puntuacion < 1 or valoracion_data.puntuacion > 5:
            return crear_respuesta_error(
                "La puntuación debe estar entre 1 y 5",
                "PUNTUACION_INVALIDA",
                HTTP_BAD_REQUEST
            )
        
        print(f"⭐ [VALORAR RECETA] Usuario {email_usuario} valorando '{valoracion_data.nombreReceta}' con {valoracion_data.puntuacion} estrellas")
        
        # Cargar recetas
        recetas = cargar_recetas()
        
        # Buscar la receta
        receta_encontrada = False
        for receta in recetas:
            if receta.get("nombreReceta") == valoracion_data.nombreReceta:
                receta_encontrada = True
                
                # Inicializar la lista de valoraciones si no existe
                if "valoraciones" not in receta:
                    receta["valoraciones"] = []
                
                # Buscar si el usuario ya valoró esta receta
                valoracion_existente = None
                for idx, val in enumerate(receta["valoraciones"]):
                    if val.get("usuario") == email_usuario:
                        valoracion_existente = idx
                        break
                
                # Crear/actualizar la valoración
                nueva_valoracion = {
                    "usuario": email_usuario,
                    "puntuacion": valoracion_data.puntuacion
                }
                
                if valoracion_existente is not None:
                    # Actualizar valoración existente
                    receta["valoraciones"][valoracion_existente] = nueva_valoracion
                    accion = "actualizada"
                else:
                    # Añadir nueva valoración
                    receta["valoraciones"].append(nueva_valoracion)
                    accion = "añadida"
                
                # Calcular valoración media
                valoracion_media = sum(v.get("puntuacion", 0) for v in receta["valoraciones"]) / len(receta["valoraciones"])
                
                # Guardar cambios
                if guardar_recetas(recetas):
                    print(f"✅ Valoración {accion} por {email_usuario} en '{valoracion_data.nombreReceta}'")
                    return crear_respuesta_exito(
                        f"Valoración {accion} correctamente",
                        {
                            "valoracion": nueva_valoracion,
                            "totalValoraciones": len(receta["valoraciones"]),
                            "valoracionMedia": round(valoracion_media, 1)
                        }
                    )
                else:
                    return crear_respuesta_error(
                        "Error al guardar la valoración",
                        "ERROR_GUARDAR",
                        HTTP_INTERNAL_SERVER_ERROR
                    )
        
        if not receta_encontrada:
            return crear_respuesta_error(
                "Receta no encontrada",
                "RECETA_NO_ENCONTRADA",
                HTTP_NOT_FOUND
            )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en valorar_receta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )


@app.get("/api/valoracion-receta/{receta_id}")
async def obtener_valoracion_receta(receta_id: str, request: Request) -> JSONResponse:
    """
    Endpoint para obtener la valoración media y total de una receta,
    además de la valoración del usuario actual si existe.
    
    Args:
        receta_id: ID de la receta (formato: receta-{index})
        request: Objeto Request de FastAPI

    Returns:
        JSONResponse: Respuesta con las valoraciones de la receta
    """
    try:
        # Verificar autenticación
        if not es_usuario_registrado(request):
            return crear_respuesta_error(
                "Debes estar registrado para ver valoraciones",
                "USUARIO_NO_AUTENTICADO",
                HTTP_BAD_REQUEST
            )
        
        # Obtener email del usuario
        email_usuario = obtener_email_usuario(request)
        
        print(f"📊 [OBTENER VALORACIONES] Obteniendo valoraciones para receta ID '{receta_id}'")
        
        # Cargar recetas
        recetas = cargar_recetas()

        receta = None

        # Soportar dos formatos de ID:
        # - "receta-{idx}" : índice directo en el array de recetas
        # - cualquier otra cadena: se intenta interpretar como nombre codificado (base64 URL encoded)
        if receta_id.startswith("receta-"):
            try:
                index = int(receta_id.replace("receta-", ""))
                if 0 <= index < len(recetas):
                    receta = recetas[index]
                else:
                    return crear_respuesta_error(
                        "Receta no encontrada",
                        "RECETA_NO_ENCONTRADA",
                        HTTP_NOT_FOUND
                    )
            except ValueError:
                return crear_respuesta_error(
                    "ID de receta inválido",
                    "ID_INVALIDO",
                    HTTP_BAD_REQUEST
                )
        else:
            # Intentar decodificar como base64 URL-encoded nombre de receta
            try:
                decoded = base64.b64decode(urllib.parse.unquote(receta_id)).decode('utf-8')
                # Buscar receta por nombre (case insensitive)
                for r in recetas:
                    if r.get('nombreReceta', '').strip().lower() == decoded.strip().lower():
                        receta = r
                        break
                if receta is None:
                    return crear_respuesta_error(
                        "Receta no encontrada por nombre codificado",
                        "RECETA_NO_ENCONTRADA",
                        HTTP_NOT_FOUND
                    )
            except Exception:
                return crear_respuesta_error(
                    "ID de receta inválido",
                    "ID_INVALIDO",
                    HTTP_BAD_REQUEST
                )

        valoraciones = receta.get("valoraciones", [])
        
        # Calcular valoración media
        valoracion_media = 0
        if len(valoraciones) > 0:
            valoracion_media = sum(v.get("puntuacion", 0) for v in valoraciones) / len(valoraciones)
        
        # Buscar valoración del usuario actual
        valoracion_usuario = None
        for val in valoraciones:
            if val.get("usuario") == email_usuario:
                valoracion_usuario = val.get("puntuacion")
                break
        
        return crear_respuesta_exito(
            "Valoraciones obtenidas correctamente",
            {
                "valoracionMedia": round(valoracion_media, 1),
                "totalValoraciones": len(valoraciones),
                "valoracionUsuario": valoracion_usuario,
                "nombreReceta": receta.get("nombreReceta")
            }
        )
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado en obtener_valoracion_receta: {e}")
        return crear_respuesta_error(
            MENSAJE_ERROR_INTERNO,
            "INTERNAL_ERROR",
            HTTP_INTERNAL_SERVER_ERROR
        )
