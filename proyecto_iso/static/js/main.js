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

    // Actualizar enlace del navbar para mostrar nombre de usuario en lugar de "Perfil"
    actualizarNavbarUsuario();

    // Manejar parámetros de URL para mostrar mensajes
    manejarParametrosURL();
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error);
  }
}

async function actualizarNavbarUsuario() {
  try {
    // Seleccionar el enlace del perfil por href para que la búsqueda
    // siga funcionando aunque cambien las clases del icono.
    const anchor = document.querySelector('a[href="/perfil"]');
    if (!anchor) return;

    // Consultar estado del usuario
    const resEstado = await fetch('/api/estado-usuario', { credentials: 'include' });
    if (!resEstado.ok) return;
    const estadoJson = await resEstado.json();
    if (!estadoJson.es_registrado) return; // dejar 'Perfil' para invitados

    // Obtener perfil para nombre de usuario
    const resPerfil = await fetch('/api/perfil', { credentials: 'include' });
    if (!resPerfil.ok) return;
    const perfilJson = await resPerfil.json();
    const nombre = perfilJson.data?.perfil?.nombreUsuario || perfilJson.perfil?.nombreUsuario || perfilJson?.perfil?.nombreUsuario || perfilJson?.data?.nombreUsuario;
    if (nombre) {
      // Mantener el href y clases; mostrar foto si existe
      const foto = perfilJson.data?.perfil?.fotoPerfil || perfilJson.perfil?.fotoPerfil || perfilJson?.fotoPerfil || perfilJson?.data?.fotoPerfil;
      // Antes de insertar contenido, quitar clases de icono del propio enlace para evitar duplicados
      anchor.classList.remove('bi', 'bi-person-circle');
      if (foto) {
        // mostrar imagen pequeña seguida del nombre
        anchor.innerHTML = `<img src="${foto}" alt="${nombre}" class="rounded-circle me-1" style="width:22px;height:22px;object-fit:cover;vertical-align:middle;"> <span class=\"navbar-username\">${nombre}</span>`;
      } else {
        // mostrar icono de persona seguido del nombre, para mantener consistencia visual
        anchor.innerHTML = `<i class="bi bi-person-circle me-1"></i><span class=\"navbar-username\">${nombre}</span>`;
      }
      anchor.setAttribute('title', nombre);
    }
  } catch (err) {
    // No bloquear la app por errores en el navbar
    console.debug('No se pudo actualizar navbar usuario:', err);
  }
}

// Exponer la función para que otros scripts en la página puedan invocarla
try {
  window.actualizarNavbarUsuario = actualizarNavbarUsuario;
} catch (e) {
  // no-op en entornos sin window
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
