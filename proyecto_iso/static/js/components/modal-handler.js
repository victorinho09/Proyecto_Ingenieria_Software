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
    // Intentar cerrar mediante la instancia de Bootstrap si está presente
    try {
      const bsInstance = bootstrap.Modal.getInstance(modal);
      if (bsInstance) {
        bsInstance.hide();
      }
    } catch (e) {
      // Silenciar si bootstrap no está presente
    }

    // Asegurar que el modal quede oculto y limpiar clases/atributos que puedan quedar
    modal.style.display = "none";
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    modal.removeAttribute("aria-modal");
    modal.style.paddingRight = "";

    // Limpiar formulario del modal si existe
    const form = modal.querySelector("form");
    if (form) {
      form.reset();
    }
  });

  // Eliminar cualquier backdrop que quede en el DOM (backdrops de Bootstrap)
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach((bd) => bd.remove());

  // Restaurar clases/estilos en body que Bootstrap pudiera haber agregado
  document.body.style.overflow = ""; // Restaurar scroll del body
  document.body.classList.remove('modal-open');
}

/**
 * Fuerza el cierre de un modal y limpia cualquier backdrop sobrante generado por Bootstrap
 * @param {HTMLElement} modal - Elemento del modal a cerrar
 */
export function closeAndClean(modal) {
  if (!modal) return;

  // Intentar usar la instancia de bootstrap si existe
  try {
    const bsInstance = bootstrap.Modal.getInstance(modal);
    if (bsInstance) {
      bsInstance.hide();
    }
  } catch (e) {
    // Silenciar si bootstrap no está presente o getInstance falla
  }

  // Asegurar que el modal quede oculto y los formularios reseteados
  modal.style.display = "none";
  const form = modal.querySelector("form");
  if (form) form.reset();

  // Eliminar cualquier backdrop que quede en el DOM
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach((bd) => bd.remove());

  // Restaurar scroll del body
  document.body.style.overflow = "";
}

/**
 * Inicializa los event listeners para los modales
 */
export function inicializarModales() {
  // Flag para saber si el pointer/mousedown comenzó dentro del contenido del modal
  let pointerDownStartedInsideModalContent = false;

  // Escuchar pointerdown (incluye mouse/touch) para detectar dónde empezó la interacción
  document.addEventListener('pointerdown', (ev) => {
    // Si el target está dentro de .modal-content consideramos que empezó dentro
    pointerDownStartedInsideModalContent = !!ev.target.closest('.modal-content, .modal-dialog');
  }, { capture: true });

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
    // Si se hace click directamente en el elemento que coincide con .modal (overlay)
    if (event.target.classList && event.target.classList.contains("modal")) {
      // Solo cerrar si la interacción NO empezó dentro del contenido del modal.
      // Evita que arrastrar/selectar dentro del modal y soltar fuera cierre el modal.
      if (!pointerDownStartedInsideModalContent) {
        const modal = event.target;
        closeAndClean(modal);
      }
      // reset flag
      pointerDownStartedInsideModalContent = false;
    }

    // Detectar clicks sobre backdrops creados por bootstrap (elementos con clase .modal-backdrop)
    if (event.target.classList && event.target.classList.contains('modal-backdrop')) {
      // Solo cerrar/eliminar si la interacción NO empezó dentro del contenido del modal.
      if (!pointerDownStartedInsideModalContent) {
        const modalVisible = document.querySelector('.modal[style*=\"display: block\"], .modal.show');
        if (modalVisible) {
          closeAndClean(modalVisible);
        } else {
          // Si no hay modal visible, simplemente eliminar el backdrop y restaurar body
          event.target.remove();
          document.body.style.overflow = "";
          document.body.classList.remove('modal-open');
        }
      }
      // reset flag
      pointerDownStartedInsideModalContent = false;
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
