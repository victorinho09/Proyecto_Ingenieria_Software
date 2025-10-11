/**
 * Servicio de API
 * Maneja las llamadas a la API para operaciones de datos
 */

import { ENDPOINTS, HTTP_CONFIG } from "../config/constants.js";

/**
 * Crea una nueva receta
 * @param {Object} recetaData - Datos de la receta
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function crearReceta(recetaData) {
  try {
    const response = await fetch(ENDPOINTS.CREAR_RECETA, {
      method: "POST",
      headers: HTTP_CONFIG.HEADERS,
      credentials: HTTP_CONFIG.CREDENTIALS,
      body: JSON.stringify(recetaData),
    });

    const data = await response.json();

    return { success: response.ok, data };
  } catch (error) {
    console.error("Error al crear receta:", error);
    return {
      success: false,
      data: { mensaje: "Error de conexión. Por favor, inténtalo de nuevo." },
    };
  }
}
