"""
Utilidades y funciones auxiliares para la aplicación web.
"""

import os
from typing import Optional
from constants import *


def verificar_archivo_existe(ruta: str) -> bool:
    """
    Verifica si un archivo existe en la ruta especificada.
    
    Args:
        ruta (str): Ruta del archivo a verificar
        
    Returns:
        bool: True si el archivo existe, False en caso contrario
    """
    return os.path.exists(ruta)


def log_operacion(tipo: str, mensaje: str, detalles: Optional[str] = None) -> None:
    """
    Registra una operación en los logs con formato consistente.
    
    Args:
        tipo (str): Tipo de log (success, error, warning, info)
        mensaje (str): Mensaje principal
        detalles (Optional[str]): Detalles adicionales opcionales
    """
    prefijos = {
        'success': LOG_SUCCESS,
        'error': LOG_ERROR,
        'warning': LOG_WARNING,
        'info': LOG_INFO
    }
    
    prefijo = prefijos.get(tipo, LOG_INFO)
    log_message = f"{prefijo} {mensaje}"
    
    if detalles:
        log_message += f" - {detalles}"
    
    print(log_message)