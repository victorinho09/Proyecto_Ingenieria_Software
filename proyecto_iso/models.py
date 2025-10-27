from pydantic import BaseModel
from typing import List

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
    pasosAseguir: str
    turnoComida: str
    duracion: int
    dificultad: str
    fotoReceta: str  # Campo para imagen en Base64 o URL
    usuariosGuardado: List[str] = []  # Lista de emails de usuarios que han guardado la receta