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

/**
 * Guarda una receta en la lista personal del usuario
 * @param {string} nombreReceta - Nombre de la receta a guardar
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function guardarReceta(nombreReceta) {
  try {
    const response = await fetch(ENDPOINTS.GUARDAR_RECETA, {
      method: "POST",
      headers: HTTP_CONFIG.HEADERS,
      credentials: HTTP_CONFIG.CREDENTIALS,
      body: JSON.stringify({ nombreReceta }),
    });

    const data = await response.json();

    return { success: response.ok, data };
  } catch (error) {
    console.error("Error al guardar receta:", error);
    return {
      success: false,
      data: { mensaje: "Error de conexión. Por favor, inténtalo de nuevo." },
    };
  }
}

/**
 * Desguarda una receta de la lista personal del usuario
 * @param {string} nombreReceta - Nombre de la receta a desguardar
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function desguardarReceta(nombreReceta) {
  try {
    const response = await fetch(ENDPOINTS.DESGUARDAR_RECETA, {
      method: "POST",
      headers: HTTP_CONFIG.HEADERS,
      credentials: HTTP_CONFIG.CREDENTIALS,
      body: JSON.stringify({ nombreReceta }),
    });

    const data = await response.json();

    return { success: response.ok, data };
  } catch (error) {
    console.error("Error al desguardar receta:", error);
    return {
      success: false,
      data: { mensaje: "Error de conexión. Por favor, inténtalo de nuevo." },
    };
  }
}

/**
 * Elimina (borra) una receta del sistema (solo el autor puede hacerlo)
 * @param {string} nombreReceta - Nombre de la receta a eliminar
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function eliminarReceta(nombreReceta) {
  try {
    const response = await fetch(ENDPOINTS.ELIMINAR_RECETA, {
      method: "POST",
      headers: HTTP_CONFIG.HEADERS,
      credentials: HTTP_CONFIG.CREDENTIALS,
      body: JSON.stringify({ nombreReceta }),
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error("Error al eliminar receta:", error);
    return {
      success: false,
      data: { mensaje: "Error de conexión. Por favor, inténtalo de nuevo." },
    };
  }
}

/**
 * Publica una receta en la comunidad
 * @param {string} recetaId - ID de la receta a publicar
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function publicarReceta(recetaId) {
  try {
    const response = await fetch(ENDPOINTS.PUBLICAR_RECETA, {
      method: "POST",
      headers: HTTP_CONFIG.HEADERS,
      credentials: HTTP_CONFIG.CREDENTIALS,
      body: JSON.stringify({ recetaId }),
    });

    const data = await response.json();

    return { success: response.ok, data };
  } catch (error) {
    console.error("Error al publicar receta:", error);
    return {
      success: false,
      data: { mensaje: "Error de conexión. Por favor, inténtalo de nuevo." },
    };
  }
}

/**
 * Obtiene todas las recetas guardadas por el usuario
 * @returns {Promise<Object>} - Respuesta del servidor con las recetas guardadas
 */
export async function cargarRecetasGuardadas() {
  try {
    const response = await fetch(ENDPOINTS.OBTENER_RECETAS_GUARDADAS, {
      method: "GET",
      headers: HTTP_CONFIG.HEADERS,
      credentials: HTTP_CONFIG.CREDENTIALS,
    });

    const data = await response.json();

    return { success: response.ok, data };
  } catch (error) {
    console.error("Error al cargar recetas guardadas:", error);
    return {
      success: false,
      data: { mensaje: "Error de conexión. Por favor, inténtalo de nuevo." },
    };
  }
}
