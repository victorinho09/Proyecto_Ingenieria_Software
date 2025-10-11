/**
 * Servicio de autenticación
 * Maneja todas las operaciones relacionadas con la autenticación de usuarios
 */

import { ENDPOINTS, HTTP_CONFIG } from "../config/constants.js";

/**
 * Realiza login de usuario
 * @param {Object} credentials - Credenciales del usuario {email, password}
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function iniciarSesion(credentials) {
  try {
    const response = await fetch(ENDPOINTS.INICIAR_SESION, {
      method: "POST",
      headers: HTTP_CONFIG.HEADERS,
      credentials: HTTP_CONFIG.CREDENTIALS,
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok && data.exito) {
      // Login exitoso: esperar un poco y luego redirigir
      setTimeout(() => {
        const currentUrl = new URL(window.location);

        // Si hay query parameters de logout, limpiarlos
        if (currentUrl.searchParams.has("logout")) {
          currentUrl.searchParams.delete("logout");
          currentUrl.searchParams.delete("t");
          window.location.href = currentUrl.toString();
        } else {
          // Si no hay query parameters problemáticos, simplemente recargar
          window.location.reload();
        }
      }, 1500);
    }

    return { success: response.ok && data.exito, data };
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return {
      success: false,
      data: { mensaje: "Error de conexión. Por favor, inténtalo de nuevo." },
    };
  }
}

/**
 * Realiza logout del usuario
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function cerrarSesion() {
  try {
    const response = await fetch(ENDPOINTS.CERRAR_SESION, {
      method: "POST",
      headers: HTTP_CONFIG.HEADERS,
      credentials: HTTP_CONFIG.CREDENTIALS,
    });

    // En el código original, el logout redirige directamente sin esperar respuesta
    window.location.href = "/?logout=true&t=" + Date.now();

    return { success: true, data: { mensaje: "Sesión cerrada correctamente" } };
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    // Incluso con error, redirigir para logout forzado
    window.location.href = "/?logout=true&t=" + Date.now();
    return {
      success: false,
      data: { mensaje: "Error de conexión. Por favor, inténtalo de nuevo." },
    };
  }
}

/**
 * Crea una nueva cuenta de usuario
 * @param {Object} userData - Datos del usuario {nombre, email, password}
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function crearCuenta(userData) {
  try {
    const response = await fetch(ENDPOINTS.CREAR_CUENTA, {
      method: "POST",
      headers: HTTP_CONFIG.HEADERS,
      credentials: HTTP_CONFIG.CREDENTIALS,
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok && data.exito) {
      // Cuenta creada exitosamente, esperar un poco y recargar
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }

    return { success: response.ok && data.exito, data };
  } catch (error) {
    console.error("Error al crear cuenta:", error);
    return {
      success: false,
      data: { mensaje: "Error de conexión. Por favor, inténtalo de nuevo." },
    };
  }
}
