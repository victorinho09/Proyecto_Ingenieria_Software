from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Cuenta(BaseModel):
    nombreUsuario: str
    email: str
    password: str

class LoginData(BaseModel):
    email: str
    password: str

class Comentario(BaseModel):
    usuario: str  # Email del usuario que comenta
    nombreUsuario: str  # Nombre del usuario para mostrar
    texto: str  # Contenido del comentario
    fecha: str  # Fecha del comentario en formato ISO

class ComentarioRequest(BaseModel):
    nombreReceta: str
    texto: str

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
    comentarios: List[Comentario] = []  # Lista de comentarios en la receta
    # Campos opcionales para modo edición
    modoEdicion: Optional[str] = "false"
    nombreRecetaOriginal: Optional[str] = ""