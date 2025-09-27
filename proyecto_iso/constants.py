# ==================== RUTAS DE ARCHIVOS ====================

# Rutas de las páginas HTML
RUTA_INDEX = "./static/index.html"
RUTA_RECETAS = "./static/recetas.html"
RUTA_MENU_SEMANAL = "./static/menusemanal.html"

# Directorio de archivos estáticos
DIRECTORIO_STATIC = "static"

# ==================== CONFIGURACIÓN DEL SERVIDOR ====================

# Configuración por defecto del servidor
SERVIDOR_HOST = "127.0.0.1"
SERVIDOR_PUERTO = 8000

# ==================== MENSAJES DE RESPUESTA ====================

# Mensajes de éxito
MENSAJE_CUENTA_CREADA = "Cuenta creada con éxito"
MENSAJE_RECETA_CREADA = "Receta creada con éxito"
MENSAJE_OPERACION_EXITOSA = "Operación realizada correctamente"

# Mensajes de error
MENSAJE_ERROR_ARCHIVO_NO_ENCONTRADO = "Error: Archivo no encontrado"
MENSAJE_ERROR_VALIDACION = "Error de validación en los datos proporcionados"
MENSAJE_ERROR_INTERNO = "Error interno del servidor"
MENSAJE_ERROR_CONEXION = "Error de conexión con el servidor"

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

# ==================== CONFIGURACIÓN DE LOGGING ====================

# Prefijos para logs
LOG_SUCCESS = "✅"
LOG_ERROR = "❌"
LOG_WARNING = "⚠️"
LOG_INFO = "ℹ️"