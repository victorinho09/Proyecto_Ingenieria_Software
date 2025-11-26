/**
 * Manejador de mensajes
 * Gestiona la visualización de mensajes de éxito, error e información
 */

/**
 * Muestra un mensaje al usuario
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de mensaje ('success', 'error', 'info', 'warning')
 * @param {number} duracion - Duración en milisegundos (por defecto 5000)
 */
export function mostrarMensaje(mensaje, tipo = "info", duracion = 5000) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const suppressed = window.sessionStorage.getItem('suppressNextFlash');
      if (suppressed === '1') {
        // consume the flag and do not show the transient message
        window.sessionStorage.removeItem('suppressNextFlash');
        return;
      }
    }
  } catch (e) {
    // ignore storage errors and continue showing the message
  }
  // Eliminar mensajes existentes
  const mensajesExistentes = document.querySelectorAll(".mensaje-flotante");
  mensajesExistentes.forEach((msg) => msg.remove());

  // Crear elemento del mensaje
  const mensajeElement = document.createElement("div");
  mensajeElement.className = `mensaje-flotante mensaje-${tipo}`;

  // Usar innerHTML para permitir saltos de línea, pero escapar HTML para seguridad
  const mensajeSeguro = mensaje
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  mensajeElement.innerHTML = mensajeSeguro;

  // Estilos del mensaje
  // Default styles for the floating message. We position the message at
  // top-left to match the application's existing visual language (see
  // screenshot). Feel free to tweak the padding / radius values.
  Object.assign(mensajeElement.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "14px 26px",
    borderRadius: "8px",
    color: "white",
    fontWeight: "700",
    fontSize: "1.02rem",
    zIndex: "10000",
    maxWidth: tipo === "error" ? "520px" : "420px",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.25)",
    opacity: "0",
    transform: "translateY(-10px)",
    transition: "all 0.28s cubic-bezier(.2,.8,.2,1)",
  });

  // Colores según el tipo
  const colores = {
    success: "#28a745",
    error: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
  };

  mensajeElement.style.backgroundColor = colores[tipo] || colores.info;

  // Agregar al DOM
  document.body.appendChild(mensajeElement);

  // Animación de entrada
  setTimeout(() => {
    mensajeElement.style.opacity = "1";
    mensajeElement.style.transform = "translateY(0)";
  }, 10);

  // Eliminar después de la duración especificada
  setTimeout(() => {
    mensajeElement.style.opacity = "0";
    mensajeElement.style.transform = "translateY(-20px)";

    setTimeout(() => {
      if (mensajeElement.parentNode) {
        mensajeElement.parentNode.removeChild(mensajeElement);
      }
    }, 300);
  }, duracion);

  // Permitir cerrar haciendo clic
  mensajeElement.addEventListener("click", () => {
    mensajeElement.style.opacity = "0";
    mensajeElement.style.transform = "translateY(-20px)";

    setTimeout(() => {
      if (mensajeElement.parentNode) {
        mensajeElement.parentNode.removeChild(mensajeElement);
      }
    }, 300);
  });
}

/**
 * Muestra un mensaje de éxito
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en milisegundos
 */
export function mostrarExito(mensaje, duracion = 5000) {
  mostrarMensaje(mensaje, "success", duracion);
}

/**
 * Muestra un mensaje de error
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en milisegundos
 */
export function mostrarError(mensaje, duracion = 2500) {
  mostrarMensaje(mensaje, "error", duracion);
}

/**
 * Muestra un mensaje de información
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en milisegundos
 */
export function mostrarInfo(mensaje, duracion = 5000) {
  mostrarMensaje(mensaje, "info", duracion);
}

/**
 * Muestra un mensaje de advertencia
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en milisegundos
 */
export function mostrarAdvertencia(mensaje, duracion = 5000) {
  mostrarMensaje(mensaje, "warning", duracion);
}
