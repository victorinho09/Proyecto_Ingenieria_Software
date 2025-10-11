/**
 * Manejador de modales
 * Gestiona la apertura, cierre y comportamiento de los modales
 */

/**
 * Abre un modal
 * @param {string} modalId - ID del modal a abrir
 */
export function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Prevenir scroll del body

    // Enfocar en el primer input del modal si existe
    const primerInput = modal.querySelector("input, textarea, select");
    if (primerInput) {
      setTimeout(() => primerInput.focus(), 100);
    }
  }
}

/**
 * Cierra un modal
 * @param {string} modalId - ID del modal a cerrar
 */
export function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = ""; // Restaurar scroll del body

    // Limpiar formulario del modal si existe
    const form = modal.querySelector("form");
    if (form) {
      form.reset();
    }
  }
}

/**
 * Cierra todos los modales abiertos
 */
export function cerrarTodosLosModales() {
  const modales = document.querySelectorAll(".modal");
  modales.forEach((modal) => {
    modal.style.display = "none";

    // Limpiar formulario del modal si existe
    const form = modal.querySelector("form");
    if (form) {
      form.reset();
    }
  });

  document.body.style.overflow = ""; // Restaurar scroll del body
}

/**
 * Inicializa los event listeners para los modales
 */
export function inicializarModales() {
  // Manejar clicks en botones de abrir modal
  document.addEventListener("click", (event) => {
    const botonAbrir = event.target.closest("[data-modal-target]");
    if (botonAbrir) {
      event.preventDefault();
      const modalId = botonAbrir.getAttribute("data-modal-target");
      abrirModal(modalId);
    }
  });

  // Manejar clicks en botones de cerrar modal
  document.addEventListener("click", (event) => {
    const botonCerrar = event.target.closest("[data-modal-close]");
    if (botonCerrar) {
      event.preventDefault();
      const modalId = botonCerrar.getAttribute("data-modal-close");
      if (modalId) {
        cerrarModal(modalId);
      } else {
        // Si no se especifica ID, cerrar el modal padre
        const modal = botonCerrar.closest(".modal");
        if (modal) {
          cerrarModal(modal.id);
        }
      }
    }
  });

  // Cerrar modal al hacer click en el overlay
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      cerrarModal(event.target.id);
    }
  });

  // Cerrar modal con la tecla Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cerrarTodosLosModales();
    }
  });
}

/**
 * Verifica si hay algún modal abierto
 * @returns {boolean} - true si hay al menos un modal abierto
 */
export function hayModalAbierto() {
  const modalesAbiertos = document.querySelectorAll(
    '.modal[style*="display: block"]'
  );
  return modalesAbiertos.length > 0;
}
