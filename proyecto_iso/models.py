from pydantic import BaseModel

class Cuenta(BaseModel):
    nombreUsuario: str
    email: str
    password: str

class LoginData(BaseModel):
    email: str
    password: str

class Receta(BaseModel):
    nombreReceta: str
    descripcion: str
    ingredientes: str
    alergenos: str
    paisOrigen: str