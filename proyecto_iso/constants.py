# ==================== IMPORTS ====================
import os

# ==================== RUTAS ABSOLUTAS ====================

# Obtener la ruta absoluta del directorio del proyecto
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ==================== RUTAS DE ARCHIVOS ====================

# Rutas de las páginas HTML
RUTA_USUARIO_REGISTRADO = "./static/registrado.html"
RUTA_USUARIO_INVITADO = "./static/invitado.html"
RUTA_RECETAS = "./static/recetas.html"
RUTA_MENU_SEMANAL = "./static/menusemanal.html"
RUTA_MIS_RECETAS = "./static/misrecetas.html"
RUTA_RECETAS_GUARDADAS = "./static/recetasguardadas.html"
RUTA_PERFIL = "./static/perfil.html"
RUTA_COMUNIDAD = "./static/comunidad.html"

# Directorio de archivos estáticos
DIRECTORIO_STATIC = "static"

# Rutas de archivos de datos
DIRECTORIO_DATOS = os.path.join(BASE_DIR, "datos")
RUTA_CUENTAS_JSON = os.path.join(DIRECTORIO_DATOS, "cuentas.json")
RUTA_RECETAS_JSON = os.path.join(DIRECTORIO_DATOS, "recetas.json")

# Configuración de imágenes
DIRECTORIO_UPLOADS = os.path.join(BASE_DIR, "static", "uploads")
DIRECTORIO_IMAGENES_RECETAS = os.path.join(BASE_DIR, "static", "uploads", "recetas")
URL_BASE_IMAGENES = "/static/uploads/recetas"
TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
EXTENSIONES_PERMITIDAS = [".jpg", ".jpeg", ".png", ".webp"]
TAMAÑO_MAXIMO_IMAGEN = 5 * 1024 * 1024  # 5MB en bytes

# ==================== CONFIGURACIÓN DEL SERVIDOR ====================

# Configuración por defecto del servidor
SERVIDOR_HOST = "127.0.0.1"
SERVIDOR_PUERTO = 8000

# ==================== MENSAJES DE RESPUESTA ====================

# Mensajes de éxito
MENSAJE_CUENTA_CREADA = "Cuenta creada con éxito"
MENSAJE_RECETA_CREADA = "Receta creada con éxito"
MENSAJE_OPERACION_EXITOSA = "Operación realizada correctamente"
MENSAJE_CUENTA_INICIADA = "Inicio de sesión exitoso"
MENSAJE_CUENTA_CERRADA = "Cuenta cerrada con éxito"
MENSAJE_INICIO_SESION_SATISFACTORIO = "Inicio de sesión exitoso"

# Mensajes de error
MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO = "Error: Archivo no encontrado"
MENSAJE_ERROR_VALIDACION = "Error de validación en los datos proporcionados"
MENSAJE_ERROR_INTERNO = "Error interno del servidor"
MENSAJE_ERROR_CONEXION = "Error de conexión con el servidor"
MENSAJE_ERROR_EMAIL_DUPLICADO = "Ya existe una cuenta con este email"
MENSAJE_INICIO_SESION_NO_SATISFACTORIO = "No se encuentra cuenta creada para iniciar sesión"

# ==================== CÓDIGOS DE ESTADO HTTP ====================

# Códigos de éxito
HTTP_OK = 200
HTTP_CREATED = 201
HTTP_SEE_OTHER = 303

# Códigos de error del cliente
HTTP_BAD_REQUEST = 400
HTTP_NOT_FOUND = 404
HTTP_UNPROCESSABLE_ENTITY = 422

# Códigos de error del servidor
HTTP_INTERNAL_SERVER_ERROR = 500

# ==================== TIPOS DE CONTENIDO ====================

CONTENT_TYPE_HTML = "text/html"
CONTENT_TYPE_JSON = "application/json"

# ==================== CONFIGURACIÓN DE COOKIES ====================

# Nombres de las cookies
COOKIE_ESTADO_USUARIO = "estado_usuario"
COOKIE_EMAIL_USUARIO = "email_usuario"

# Valores posibles para el estado del usuario
ESTADO_INVITADO = "invitado"
ESTADO_REGISTRADO = "registrado"

# Configuración común de cookies (aprovecha middleware anti-cache)
COOKIE_CONFIG = {
    "max_age": 86400,  # 24 horas
    "path": "/",
    "samesite": "lax"
}

# ==================== CONFIGURACIÓN DE LOGGING ====================

# Prefijos para logs
LOG_SUCCESS = "✅"
LOG_ERROR = "❌"
LOG_WARNING = "⚠️"
LOG_INFO = "ℹ️"