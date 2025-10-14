import os
import json
import base64
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from constants import *
import re


def verificar_archivo_existe(ruta: str) -> bool:
    """
    Verifica si un archivo existe en la ruta especificada.
    
    Args:
        ruta (str): Ruta del archivo a verificar
        
    Returns:
        bool: True si el archivo existe, False en caso contrario
    """
    return os.path.exists(ruta)


def crear_directorio_si_no_existe(directorio: str) -> None:
    """
    Crea un directorio si no existe.
    
    Args:
        directorio (str): Ruta del directorio a crear
    """
    try:
        if not os.path.exists(directorio):
            os.makedirs(directorio, exist_ok=True)
            print(f"{LOG_SUCCESS} Directorio creado: {directorio}")
        else:
            print(f"{LOG_INFO} Directorio ya existe: {directorio}")
    except Exception as e:
        print(f"{LOG_ERROR} Error al crear directorio {directorio}: {e}")
        raise


def cargar_cuentas() -> List[Dict[str, Any]]:
    """
    Carga las cuentas desde el archivo JSON.
    
    Returns:
        List[Dict[str, Any]]: Lista de cuentas o lista vacía si no existe el archivo
    """
    try:
        # Crear directorio de datos si no existe
        crear_directorio_si_no_existe(DIRECTORIO_DATOS)
        
        if verificar_archivo_existe(RUTA_CUENTAS_JSON):
            with open(RUTA_CUENTAS_JSON, 'r', encoding='utf-8') as archivo:
                return json.load(archivo)
        else:
            return []
    except (json.JSONDecodeError, IOError) as e:
        print(f"{LOG_ERROR} Error al cargar cuentas: {e}")
        return []


def guardar_cuentas(cuentas: List[Dict[str, Any]]) -> bool:
    """
    Guarda las cuentas en el archivo JSON.
    
    Args:
        cuentas (List[Dict[str, Any]]): Lista de cuentas a guardar
        
    Returns:
        bool: True si se guardó correctamente, False en caso contrario
    """
    try:
        # Crear directorio de datos si no existe
        crear_directorio_si_no_existe(DIRECTORIO_DATOS)
        
        with open(RUTA_CUENTAS_JSON, 'w', encoding='utf-8') as archivo:
            json.dump(cuentas, archivo, ensure_ascii=False, indent=2)
        return True
    except IOError as e:
        print(f"{LOG_ERROR} Error al guardar cuentas: {e}")
        return False

def validar_cuenta(email: str, password: str) -> bool:
    """
    Verifica si existe una cuenta que coincida con el email y passwords especificados por parametro
    
    Args:
        email (str): Email a verificar
        password (str): Password a verificar
        
    Returns:
        bool: True si existe una cuenta, False en caso contrario
    """
    try:
        cuentas = cargar_cuentas()
        # Buscar una cuenta que coincida con email y password
        return any(
            cuenta['email'].lower() == email.lower() and 
            cuenta['password'] == password 
            for cuenta in cuentas
        )
    except Exception as e:
        print(f"{LOG_ERROR} Error al validar cuenta: {e}")
        return False 

def email_ya_existe(email: str) -> bool:
    """
    Verifica si ya existe una cuenta con el email especificado.
    
    Args:
        email (str): Email a verificar
        
    Returns:
        bool: True si el email ya existe, False en caso contrario
    """
    cuentas = cargar_cuentas()
    return any(cuenta['email'].lower() == email.lower() for cuenta in cuentas)


def validar_password(password: str) -> Tuple[bool, str]:
    """
    Valida que la contraseña cumpla con los requisitos de seguridad.
    
    Args:
        password (str): Contraseña a validar
        
    Returns:
        Tuple[bool, str]: (True, "") si la contraseña es válida, (False, mensaje_error) si no lo es
    """
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres"
    
    if not re.search(r'[A-Z]', password):
        return False, "La contraseña debe contener al menos una letra mayúscula"
        
    if not re.search(r'[a-z]', password):
        return False, "La contraseña debe contener al menos una letra minúscula"
        
    if not re.search(r'[0-9]', password):
        return False, "La contraseña debe contener al menos un número"
    
    return True, ""

def guardar_nueva_cuenta(cuenta_data: Dict[str, Any]) -> bool:
    """
    Guarda una nueva cuenta en el archivo JSON.
    
    Args:
        cuenta_data (Dict[str, Any]): Datos de la cuenta a guardar
        
    Returns:
        bool: True si se guardó correctamente, False en caso contrario
    """
    try:
        # Verificar si el email ya existe
        if email_ya_existe(cuenta_data['email']):
            return False
        
        # Cargar cuentas existentes
        cuentas = cargar_cuentas()
        
        # Añadir la nueva cuenta
        cuentas.append(cuenta_data)
        
        # Guardar todas las cuentas
        return guardar_cuentas(cuentas)
        
    except Exception as e:
        print(f"{LOG_ERROR} Error al guardar nueva cuenta: {e}")
        return False


# ==================== FUNCIONES DE UTILIDAD PARA RECETAS ====================

def cargar_recetas() -> List[Dict[str, Any]]:
    """
    Carga las recetas desde el archivo JSON.
    
    Returns:
        List[Dict[str, Any]]: Lista de recetas o lista vacía si no existe el archivo
    """
    try:
        # Crear directorio de datos si no existe
        crear_directorio_si_no_existe(DIRECTORIO_DATOS)
        
        if verificar_archivo_existe(RUTA_RECETAS_JSON):
            with open(RUTA_RECETAS_JSON, 'r', encoding='utf-8') as archivo:
                return json.load(archivo)
        else:
            return []
    except (json.JSONDecodeError, IOError) as e:
        print(f"{LOG_ERROR} Error al cargar recetas: {e}")
        return []


def guardar_recetas(recetas: List[Dict[str, Any]]) -> bool:
    """
    Guarda las recetas en el archivo JSON.
    
    Args:
        recetas (List[Dict[str, Any]]): Lista de recetas a guardar
        
    Returns:
        bool: True si se guardó correctamente, False en caso contrario
    """
    try:
        # Crear directorio de datos si no existe
        crear_directorio_si_no_existe(DIRECTORIO_DATOS)
        
        with open(RUTA_RECETAS_JSON, 'w', encoding='utf-8') as archivo:
            json.dump(recetas, archivo, ensure_ascii=False, indent=2)
        return True
    except IOError as e:
        print(f"{LOG_ERROR} Error al guardar recetas: {e}")
        return False


def preparar_datos_receta(receta_data: Dict[str, Any], email_usuario: str) -> Dict[str, Any]:
    """
    Prepara los datos de la receta para guardar, incluyendo campos vacíos para opcionales.
    
    Args:
        receta_data (Dict[str, Any]): Datos de la receta del formulario
        email_usuario (str): Email del usuario que crea la receta
        
    Returns:
        Dict[str, Any]: Datos de la receta preparados con todos los campos
    """
    # Estructura completa de una receta con campos opcionales vacíos
    receta_completa = {
        # Campos obligatorios
        "nombreReceta": receta_data.get("nombreReceta", ""),
        "descripcion": receta_data.get("descripcion", ""),
        "ingredientes": receta_data.get("ingredientes", ""),
        "pasosAseguir": receta_data.get("pasosAseguir", ""),
        "duracion": receta_data.get("duracion", ""),
        "fotoReceta": receta_data.get("fotoReceta", ""),
        
        # Campos opcionales (vacíos si no se proporcionan)
        "alergenos": receta_data.get("alergenos", ""),
        "paisOrigen": receta_data.get("paisOrigen", ""),
        "turnoComida": receta_data.get("turnoComida", ""),
        "dificultad": receta_data.get("dificultad", ""),
        
        # Campo adicional: usuario que creó la receta
        "usuario": email_usuario
    }
    
    return receta_completa


def guardar_nueva_receta(receta_data: Dict[str, Any], email_usuario: str) -> bool:
    """
    Guarda una nueva receta en el archivo JSON.
    
    Args:
        receta_data (Dict[str, Any]): Datos de la receta a guardar
        email_usuario (str): Email del usuario que crea la receta
        
    Returns:
        bool: True si se guardó correctamente, False en caso contrario
    """
    try:
        # Cargar recetas existentes
        recetas = cargar_recetas()
        
        # Preparar datos completos de la receta
        receta_completa = preparar_datos_receta(receta_data, email_usuario)
        
        # Añadir la nueva receta
        recetas.append(receta_completa)
        
        # Guardar todas las recetas
        exito = guardar_recetas(recetas)
        
        if exito:
            print(f"{LOG_SUCCESS} Receta '{receta_completa['nombreReceta']}' guardada para usuario {email_usuario}")
        
        return exito
        
    except Exception as e:
        print(f"{LOG_ERROR} Error al guardar nueva receta: {e}")
        return False


def obtener_recetas_usuario(email_usuario: str) -> List[Dict[str, Any]]:
    """
    Obtiene todas las recetas de un usuario específico.
    
    Args:
        email_usuario (str): Email del usuario
        
    Returns:
        List[Dict[str, Any]]: Lista de recetas del usuario
    """
    try:
        # Cargar todas las recetas
        todas_las_recetas = cargar_recetas()
        
        # Filtrar solo las recetas del usuario
        recetas_usuario = [
            receta for receta in todas_las_recetas 
            if receta.get("usuario", "").lower() == email_usuario.lower()
        ]
        
        print(f"{LOG_INFO} Encontradas {len(recetas_usuario)} recetas para usuario {email_usuario}")
        return recetas_usuario
        
    except Exception as e:
        print(f"{LOG_ERROR} Error al obtener recetas del usuario: {e}")
        return []


# ==================== FUNCIONES DE UTILIDAD PARA IMÁGENES ====================

def validar_base64_imagen(base64_string: str) -> Tuple[bool, str]:
    """
    Valida si una cadena Base64 representa una imagen válida.
    
    Args:
        base64_string (str): Cadena Base64 a validar
        
    Returns:
        Tuple[bool, str]: (True, tipo_mime) si es válida, (False, mensaje_error) si no lo es
    """
    try:
        # Verificar si tiene el prefijo data:image
        if not base64_string.startswith('data:image/'):
            return False, "La imagen debe estar en formato Base64 con prefijo data:image/"
        
        # Extraer tipo MIME y datos Base64
        header, data = base64_string.split(',', 1)
        tipo_mime = header.split(':')[1].split(';')[0]
        
        # Validar tipo MIME
        if tipo_mime not in TIPOS_IMAGEN_PERMITIDOS:
            return False, f"Tipo de imagen no permitido. Tipos válidos: {', '.join(TIPOS_IMAGEN_PERMITIDOS)}"
        
        # Decodificar Base64 para verificar validez
        imagen_bytes = base64.b64decode(data)
        
        # Verificar tamaño
        if len(imagen_bytes) > TAMAÑO_MAXIMO_IMAGEN:
            return False, f"La imagen es muy grande. Tamaño máximo: {TAMAÑO_MAXIMO_IMAGEN // (1024*1024)}MB"
        
        # Verificar que no esté vacía
        if len(imagen_bytes) == 0:
            return False, "La imagen está vacía"
        
        return True, tipo_mime
        
    except Exception as e:
        return False, f"Error al validar imagen: {str(e)}"


def obtener_extension_desde_mime(tipo_mime: str) -> str:
    """
    Obtiene la extensión de archivo basada en el tipo MIME.
    
    Args:
        tipo_mime (str): Tipo MIME de la imagen
        
    Returns:
        str: Extensión del archivo
    """
    extensiones = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg", 
        "image/png": ".png",
        "image/webp": ".webp"
    }
    return extensiones.get(tipo_mime, ".jpg")


def generar_nombre_archivo_unico(email_usuario: str, extension: str) -> str:
    """
    Genera un nombre de archivo único para evitar colisiones.
    
    Args:
        email_usuario (str): Email del usuario que sube la imagen
        extension (str): Extensión del archivo
        
    Returns:
        str: Nombre de archivo único
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    usuario_limpio = re.sub(r'[^a-zA-Z0-9]', '_', email_usuario.split('@')[0])
    id_unico = str(uuid.uuid4())[:8]
    
    return f"{timestamp}_{usuario_limpio}_{id_unico}{extension}"


def guardar_imagen_base64(base64_string: str, email_usuario: str) -> Tuple[bool, str]:
    """
    Guarda una imagen Base64 como archivo en el servidor.
    
    Args:
        base64_string (str): Imagen en formato Base64
        email_usuario (str): Email del usuario que sube la imagen
        
    Returns:
        Tuple[bool, str]: (True, url_imagen) si se guardó correctamente, (False, mensaje_error) si falló
    """
    try:
        # Validar imagen Base64
        es_valida, resultado = validar_base64_imagen(base64_string)
        if not es_valida:
            return False, resultado
        
        tipo_mime = resultado
        
        # Crear directorios si no existen
        crear_directorio_si_no_existe(DIRECTORIO_UPLOADS)
        crear_directorio_si_no_existe(DIRECTORIO_IMAGENES_RECETAS)
        
        # Extraer datos Base64
        header, data = base64_string.split(',', 1)
        imagen_bytes = base64.b64decode(data)
        
        # Generar nombre de archivo único
        extension = obtener_extension_desde_mime(tipo_mime)
        nombre_archivo = generar_nombre_archivo_unico(email_usuario, extension)
        
        # Ruta completa del archivo
        ruta_archivo = os.path.join(DIRECTORIO_IMAGENES_RECETAS, nombre_archivo)
        
        # Guardar archivo
        with open(ruta_archivo, 'wb') as archivo:
            archivo.write(imagen_bytes)
        
        # Generar URL de la imagen
        url_imagen = f"{URL_BASE_IMAGENES}/{nombre_archivo}"
        
        print(f"{LOG_SUCCESS} Imagen guardada: {nombre_archivo} para usuario {email_usuario}")
        return True, url_imagen
        
    except Exception as e:
        print(f"{LOG_ERROR} Error al guardar imagen: {e}")
        return False, f"Error interno al guardar imagen: {str(e)}"


def procesar_imagen_receta(receta_data: Dict[str, Any], email_usuario: str) -> Dict[str, Any]:
    """
    Procesa la imagen de una receta: convierte Base64 a archivo y actualiza la URL.
    
    Args:
        receta_data (Dict[str, Any]): Datos de la receta
        email_usuario (str): Email del usuario
        
    Returns:
        Dict[str, Any]: Datos de la receta con imagen procesada
    """
    try:
        foto_receta = receta_data.get("fotoReceta", "")
        print(f"{LOG_INFO} [PROCESAR IMAGEN] Procesando imagen para usuario: {email_usuario}")
        print(f"{LOG_INFO} [PROCESAR IMAGEN] Longitud de fotoReceta: {len(foto_receta) if foto_receta else 0}")
        
        # Si no hay imagen o está vacía, es un error ahora que es obligatoria
        if not foto_receta or foto_receta.strip() == "":
            print(f"{LOG_ERROR} [PROCESAR IMAGEN] La imagen es obligatoria pero no se proporcionó")
            receta_data["fotoReceta"] = ""
            return receta_data
        
        # Si ya es una URL (no Base64), mantenerla
        if not foto_receta.startswith('data:image/'):
            print(f"{LOG_INFO} [PROCESAR IMAGEN] Ya es una URL, no procesando: {foto_receta[:50]}...")
            return receta_data
        
        print(f"{LOG_INFO} [PROCESAR IMAGEN] Detectado Base64, procesando...")
        
        # Procesar imagen Base64
        exito, resultado = guardar_imagen_base64(foto_receta, email_usuario)
        
        if exito:
            # Actualizar con la URL de la imagen guardada
            receta_data["fotoReceta"] = resultado
            print(f"{LOG_SUCCESS} Imagen procesada correctamente: {resultado}")
        else:
            # En caso de error, dejar vacío y loggear el error
            print(f"{LOG_ERROR} Error al procesar imagen de receta: {resultado}")
            receta_data["fotoReceta"] = ""
        
        return receta_data
        
    except Exception as e:
        print(f"{LOG_ERROR} Error inesperado al procesar imagen de receta: {e}")
        receta_data["fotoReceta"] = ""
        return receta_data


# ==================== FUNCIONES DE GESTIÓN DE RECETAS GUARDADAS ====================

def guardar_receta_usuario(nombre_receta: str, email_usuario: str) -> bool:
    """
    Guarda una receta para un usuario específico.
    
    Args:
        nombre_receta (str): Nombre de la receta a guardar
        email_usuario (str): Email del usuario que guarda la receta
        
    Returns:
        bool: True si se guardó correctamente, False en caso contrario
    """
    try:
        recetas = cargar_recetas()
        receta_encontrada = False
        
        for receta in recetas:
            if receta["nombreReceta"] == nombre_receta:
                receta_encontrada = True
                # Verificar si el usuario ya guardó esta receta
                if "usuariosGuardado" not in receta:
                    receta["usuariosGuardado"] = []
                
                if email_usuario not in receta["usuariosGuardado"]:
                    receta["usuariosGuardado"].append(email_usuario)
                    guardar_recetas(recetas)
                    print(f"{LOG_SUCCESS} Usuario {email_usuario} guardó la receta '{nombre_receta}'")
                    return True
                else:
                    print(f"{LOG_INFO} Usuario {email_usuario} ya tenía guardada la receta '{nombre_receta}'")
                    return True
        
        if not receta_encontrada:
            print(f"{LOG_ERROR} No se encontró la receta '{nombre_receta}'")
            return False
            
    except Exception as e:
        print(f"{LOG_ERROR} Error al guardar receta para usuario: {e}")
        return False


def desguardar_receta_usuario(nombre_receta: str, email_usuario: str) -> bool:
    """
    Desguarda una receta para un usuario específico.
    
    Args:
        nombre_receta (str): Nombre de la receta a desguardar
        email_usuario (str): Email del usuario que desguarda la receta
        
    Returns:
        bool: True si se desguardó correctamente, False en caso contrario
    """
    try:
        recetas = cargar_recetas()
        receta_encontrada = False
        
        for receta in recetas:
            if receta["nombreReceta"] == nombre_receta:
                receta_encontrada = True
                # Verificar si el usuario tenía guardada esta receta
                if "usuariosGuardado" in receta and email_usuario in receta["usuariosGuardado"]:
                    receta["usuariosGuardado"].remove(email_usuario)
                    guardar_recetas(recetas)
                    print(f"{LOG_SUCCESS} Usuario {email_usuario} desguardó la receta '{nombre_receta}'")
                    return True
                else:
                    print(f"{LOG_INFO} Usuario {email_usuario} no tenía guardada la receta '{nombre_receta}'")
                    return True
        
        if not receta_encontrada:
            print(f"{LOG_ERROR} No se encontró la receta '{nombre_receta}'")
            return False
            
    except Exception as e:
        print(f"{LOG_ERROR} Error al desguardar receta para usuario: {e}")
        return False


def obtener_recetas_guardadas_usuario(email_usuario: str) -> List[Dict[str, Any]]:
    """
    Obtiene todas las recetas guardadas por un usuario específico.
    
    Args:
        email_usuario (str): Email del usuario
        
    Returns:
        List[Dict[str, Any]]: Lista de recetas guardadas por el usuario
    """
    try:
        recetas = cargar_recetas()
        recetas_guardadas = []
        
        for receta in recetas:
            if "usuariosGuardado" in receta and email_usuario in receta["usuariosGuardado"]:
                recetas_guardadas.append(receta)
        
        print(f"{LOG_INFO} Usuario {email_usuario} tiene {len(recetas_guardadas)} recetas guardadas")
        return recetas_guardadas
        
    except Exception as e:
        print(f"{LOG_ERROR} Error al obtener recetas guardadas para usuario: {e}")
        return []


def es_receta_guardada_por_usuario(nombre_receta: str, email_usuario: str) -> bool:
    """
    Verifica si una receta específica está guardada por un usuario.
    
    Args:
        nombre_receta (str): Nombre de la receta
        email_usuario (str): Email del usuario
        
    Returns:
        bool: True si la receta está guardada por el usuario, False en caso contrario
    """
    try:
        recetas = cargar_recetas()
        
        for receta in recetas:
            if (receta["nombreReceta"] == nombre_receta and 
                "usuariosGuardado" in receta and 
                email_usuario in receta["usuariosGuardado"]):
                return True
        
        return False
        
    except Exception as e:
        print(f"{LOG_ERROR} Error al verificar si receta está guardada: {e}")
        return False