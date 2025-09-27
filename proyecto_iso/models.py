from pydantic import BaseModel

class Cuenta(BaseModel):
    nombreUsuario: str
    email: str
    password: str