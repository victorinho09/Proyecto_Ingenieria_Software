import os
import json
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
    if not os.path.exists(directorio):
        os.makedirs(directorio)


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