"""
Servicio de validación de email
"""
import aiohttp


async def verificar_email_api(email: str) -> tuple[bool, str]:
    """
    Verifica si un email es válido usando la API de Abstract
    
    Args:
        email (str): Email a verificar
        
    Returns:
        tuple[bool, str]: (es_valido, mensaje)
    """
    API_KEY = "8646e2fe5cc0436db3a9d1671d4ca6b2"  # Reemplazar con tu API key de Abstract
    API_URL = f"https://emailreputation.abstractapi.com/v1/?api_key={API_KEY}&email={email}"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(API_URL) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Verificar el resultado
                    email_deliverability = data.get("email_deliverability", {})
                    status = email_deliverability.get("status", False)
                    is_format_valid = email_deliverability.get("is_format_valid", False)
                    is_mx_valid = email_deliverability.get("is_mx_valid", False)

                    # Validaciones
                    if not is_format_valid or not is_mx_valid or status != "deliverable":
                        return False, "El email no es válido"
                            
                  
                    return True, "Email válido"
                else:
                    return False, "No se pudo verificar el email"
    except Exception as e:
        return False, f"Error al verificar el email: {str(e)}"