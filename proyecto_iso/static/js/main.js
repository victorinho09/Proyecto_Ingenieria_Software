/**
 * Archivo principal de la aplicación
 * Orquesta todos los módulos y inicializa la aplicación
 */

// Importar módulos
import { inicializarFormularios } from "./components/form-handler.js";
import { inicializarModales } from "./components/modal-handler.js";
import { mostrarMensaje } from "./components/message-handler.js";

/**
 * Inicializa la aplicación
 */
function inicializarApp() {
  // Verificar que el DOM esté completamente cargado
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarApp);
    return;
  }

  try {
    // Inicializar componentes
    inicializarFormularios();
    inicializarModales();

    // Manejar parámetros de URL para mostrar mensajes
    manejarParametrosURL();
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error);
  }
}

/**
 * Maneja los parámetros de la URL para mostrar mensajes
 */
function manejarParametrosURL() {
  const urlParams = new URLSearchParams(window.location.search);

  // Manejar mensaje de logout
  if (urlParams.get("logout") === "true") {
    mostrarMensaje("Sesión cerrada correctamente", "success");

    // Limpiar la URL sin recargar la página
    const nuevaURL = window.location.pathname;
    window.history.replaceState({}, document.title, nuevaURL);
  }
}

// Inicializar la aplicación
inicializarApp();
