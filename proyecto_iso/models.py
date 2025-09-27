"""
Modelos de datos para la aplicación web.
Contiene las clases básicas sin validaciones.
"""

from pydantic import BaseModel

class Cuenta(BaseModel):
    """
    Modelo básico para la creación de cuentas de usuario.
    
    Attributes:
        nombreUsuario (str): Nombre de usuario
        email (str): Dirección de correo electrónico
        password (str): Contraseña del usuario
    """
    nombreUsuario: str
    email: str
    password: str