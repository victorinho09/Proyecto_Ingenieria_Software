/**
 * Constantes de la aplicación
 * Centraliza todas las constantes para fácil mantenimiento
 */

export const RUTA_USUARIO_INVITADO = "invitado.html";

export const ENDPOINTS = {
  CREAR_CUENTA: "/crear-cuenta",
  INICIAR_SESION: "/iniciar-sesion",
  CERRAR_SESION: "/cerrar-sesion",
  CREAR_RECETA: "/crear-receta",
};

export const HTTP_CONFIG = {
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  CREDENTIALS: "same-origin", // Importante: incluir cookies
};
