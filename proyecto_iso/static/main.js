document.addEventListener("DOMContentLoaded", function () {
  // Inicializar event listeners cuando el DOM esté cargado
  inicializarEventListeners();
});

function inicializarEventListeners() {
  // Event listener para el formulario de crear cuenta
  const crearCuentaForm = document.getElementById("crearCuentaForm");
  if (crearCuentaForm) {
    crearCuentaForm.addEventListener("submit", manejarEnvioFormulario);
  }

  // Event listener para limpiar mensajes cuando se abre el modal
  const crearCuentaModal = document.getElementById("crearCuentaModal");
  if (crearCuentaModal) {
    crearCuentaModal.addEventListener("show.bs.modal", limpiarMensajes);
  }
}

/**
 * Maneja el envío del formulario de crear cuenta
 * @param {Event} e - Evento de submit del formulario
 */
async function manejarEnvioFormulario(e) {
  e.preventDefault(); // Prevenir el envío normal del formulario

  const form = e.target;
  const mensajeContainer = document.getElementById("mensajeContainer");

  // Obtener los valores del formulario
  const formData = {
    nombreUsuario: form.nombreUsuario.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value,
  };

  // Validación básica del lado cliente
  if (!validarDatosFormulario(formData)) {
    mostrarMensaje(
      mensajeContainer,
      "error",
      "❌ Por favor, completa todos los campos correctamente."
    );
    return;
  }

  try {
    // Enviar datos como JSON al servidor
    const response = await fetch("/crear-cuenta", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok && result.exito) {
      // Ocultar el formulario
      form.style.display = "none";

      // Ocultar los botones del footer
      const modalFooter = document.getElementById("modalFooter");
      if (modalFooter) {
        modalFooter.style.display = "none";
      }

      // Mostrar mensaje de éxito
      mostrarMensaje(mensajeContainer, "success", `✅ ${result.mensaje}`);

      // Limpiar el formulario
      form.reset();

      // Cerrar el modal después de 1 segundo (reducido)
      setTimeout(() => {
        cerrarModal();
      }, 1000);

      // Restaurar elementos después de que el modal se haya cerrado
      setTimeout(() => {
        form.style.display = "block";
        const modalFooter = document.getElementById("modalFooter");
        if (modalFooter) {
          modalFooter.style.display = "block";
        }
      }, 1500); // 500ms después del cierre
    } else {
      // Mostrar mensaje de error del servidor
      mostrarMensaje(
        mensajeContainer,
        "error",
        `❌ ${result.mensaje || "Error desconocido"}`
      );
    }
  } catch (error) {
    // Error de conexión o parsing JSON
    console.error("Error:", error);
    mostrarMensaje(
      mensajeContainer,
      "error",
      "❌ Error de conexión. Verifica tu conexión a internet."
    );
  }
}

/**
 * Valida los datos del formulario del lado cliente
 * @param {Object} data - Datos del formulario
 * @returns {boolean} - true si los datos son válidos
 */
function validarDatosFormulario(data) {
  // Validar que todos los campos estén llenos
  if (!data.nombreUsuario || !data.email || !data.password) {
    return false;
  }

  // Validar formato de email básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return false;
  }

  return true;
}

/**
 * Muestra un mensaje en el contenedor especificado
 * @param {HTMLElement} container - Contenedor del mensaje
 * @param {string} type - Tipo de mensaje ('success' o 'error')
 * @param {string} message - Texto del mensaje
 */
function mostrarMensaje(container, type, message) {
  if (!container) return;

  const alertClass = type === "success" ? "alert-success" : "alert-danger";
  container.className = `alert ${alertClass}`;
  container.innerHTML = message;
  container.style.display = "block";
}

/**
 * Limpia los mensajes cuando se abre el modal
 */
function limpiarMensajes() {
  const mensajeContainer = document.getElementById("mensajeContainer");
  if (mensajeContainer) {
    mensajeContainer.style.display = "none";
  }
}

/**
 * Cierra el modal de crear cuenta
 */
function cerrarModal() {
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("crearCuentaModal")
  );
  if (modal) {
    modal.hide();
  }
}
