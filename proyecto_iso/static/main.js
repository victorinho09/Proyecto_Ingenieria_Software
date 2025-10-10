const RUTA_USUARIO_INVITADO = "invitado.html";

// Configuración de formularios por ID
const CONFIGURACION_FORMULARIOS = {
  crearCuentaForm: {
    endpoint: "/crear-cuenta",
    modal: "crearCuentaModal",
    campos: ["nombreUsuario", "emailCrearCuenta", "passwordCrearCuenta"],
    validaciones: {
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      password: validarPassword,
    },
  },
  iniciarSesionForm: {
    endpoint: "/iniciar-sesion",
    modal: "iniciarSesionModal",
    campos: ["emailIniciarSesion", "passwordIniciarSesion"],
    validaciones: {
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      password: validarPassword,
    },
  },

  cerrarSesionForm: {
    endpoint: "/cerrar-sesion",
    modal: "cerrarSesionModal",
    campos: [],
    validaciones: {},
  },

  crearRecetaForm: {
    endpoint: "/crear-receta",
    modal: "crearRecetaModal",
    campos: [
      "nombreReceta",
      "descripcion",
      "ingredientes",
      "alergenos",
      "paisOrigen",
      "pasosAseguir",
      "turnoComida",
      "duracion",
      "dificultad",
      "fotoReceta",
    ],
    camposRequeridos: [
      "nombreReceta",
      "descripcion",
      "ingredientes",
      "pasosAseguir",
      "duracion",
      "fotoReceta",
    ],
    validaciones: {},
  },
};

// Función para validar la contraseña
function validarPassword(password) {
  const longitud = password.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneMinuscula = /[a-z]/.test(password);
  const tieneNumero = /[0-9]/.test(password);

  if (!longitud) {
    mostrarErrorPassword("La contraseña debe tener al menos 8 caracteres");
    return false;
  }
  if (!tieneMayuscula) {
    mostrarErrorPassword("La contraseña debe contener al menos una letra mayúscula");
    return false;
  }
  if (!tieneMinuscula) {
    mostrarErrorPassword("La contraseña debe contener al menos una letra minúscula");
    return false;
  }
  if (!tieneNumero) {
    mostrarErrorPassword("La contraseña debe contener al menos un número");
    return false;
  }

  return true;
}

// Función para mostrar errores específicos de la contraseña
function mostrarErrorPassword(mensaje) {
  const forms = ['crearCuentaForm', 'iniciarSesionForm'];
  forms.forEach(formId => {
    const form = document.getElementById(formId);
    if (form) {
      const config = CONFIGURACION_FORMULARIOS[formId];
      const modal = document.getElementById(config.modal);
      const mensajeContainer = modal ? modal.querySelector("#mensajeContainer, .alert") : null;
      if (mensajeContainer) {
        mostrarMensaje(mensajeContainer, "error", `❌ ${mensaje}`);
      }
    }
  });
}

// Función para detectar si el usuario está en modo invitado
function esInvitado() {
  // El archivo invitado.html se sirve desde la ruta raíz "/"
  const pathname = window.location.pathname;
  const esRaiz = pathname === "/" || pathname === "";

  return esRaiz;
}

function ocultarBotonesModal(config) {
  // Ocultar los botones del footer del modal específico
  const modal = document.getElementById(config.modal);
  const modalFooter = modal ? modal.querySelector(".modal-footer") : null;
  if (modalFooter) {
    modalFooter.style.display = "none";
  }
}

/**
 * Cierra el modal especificado
 * @param {string} modalId - ID del modal a cerrar
 */
function cerrarModal(modalId) {
  const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
  if (modal) {
    modal.hide();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar event listeners cuando el DOM esté cargado
  console.log("DOM cargado");
  inicializarEventListeners();
});

function inicializarEventListeners() {
  // Configurar todos los formularios disponibles en la página
  Object.keys(CONFIGURACION_FORMULARIOS).forEach((formId) => {
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener("submit", (e) => manejarEnvioFormulario(e, formId));
    }

    // Event listener para limpiar mensajes cuando se abre el modal
    const config = CONFIGURACION_FORMULARIOS[formId];
    const modal = document.getElementById(config.modal);
    if (modal) {
      modal.addEventListener("show.bs.modal", () =>
        limpiarMensajes(config.modal)
      );
    }
  });
}

/**
 * Maneja el envío de cualquier formulario configurado
 * @param {Event} e - Evento de submit del formulario
 * @param {string} formId - ID del formulario que se está enviando
 */
async function manejarEnvioFormulario(e, formId) {
  e.preventDefault(); // Prevenir el envío normal del formulario

  const form = e.target;
  const config = CONFIGURACION_FORMULARIOS[formId];
  const modal = document.getElementById(config.modal);
  const mensajeContainer = modal
    ? modal.querySelector("#mensajeContainer, .alert")
    : null;

  // Obtener los valores del formulario dinámicamente
  const formData = {};
  config.campos.forEach((campo) => {
    const element = form[campo];
    if (element) {
      if (element.id == "emailCrearCuenta") {
        formData["email"] = element.value.trim();
      } else if (element.id == "passwordCrearCuenta") {
        formData["password"] = element.value.trim();
      } else if (element.id == "emailIniciarSesion") {
        formData["email"] = element.value.trim();
      } else if (element.id == "passwordIniciarSesion") {
        formData["password"] = element.value.trim();
      } else {
        formData[campo] = element.value.trim();
      }
    }
  });

  // Validación básica del lado cliente
  if (!validarDatosFormulario(formData, config)) {
    // Solo mostrar el mensaje genérico si no hay un mensaje específico de error de contraseña
    if (!mensajeContainer.innerHTML) {
      mostrarMensaje(
        mensajeContainer,
        "error",
        "❌ Por favor, completa todos los campos correctamente."
      );
    }
    return;
  }

  try {
    // Enviar datos como JSON al servidor
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok && result.exito) {
      // Verificar si es un usuario invitado que ha iniciado sesión correctamente
      if (esInvitado() && config.endpoint === "/iniciar-sesion") {
        // Para usuarios invitados que inician sesión, redirigir directamente
        mostrarMensaje(
          mensajeContainer,
          "success",
          `✅ ${result.mensaje} Redirigiendo...`
        );

        // Ocultar el formulario inmediatamente para evitar mostrar formulario vacío
        form.style.display = "none";

        // Limpiar el formulario
        form.reset();

        ocultarBotonesModal(config);

        // Solicitar al servidor la página de usuario registrado
        setTimeout(async () => {
          try {
            const response = await fetch("/registrado");
            if (response.ok) {
              const html = await response.text();
              // Reemplazar todo el contenido de la página con el HTML del servidor
              document.documentElement.innerHTML = html;
            } else {
              console.error("Error al obtener la página de registrado");
            }
          } catch (error) {
            console.error(
              "Error de conexión al obtener registrado.html:",
              error
            );
          }
        }, 1000);

        return; // Salir temprano para evitar el comportamiento normal del modal
      }

      // Comportamiento normal para otros casos (crear cuenta, etc.)
      // Ocultar el formulario
      form.style.display = "none";

      ocultarBotonesModal(config);

      // Mostrar mensaje de éxito
      mostrarMensaje(mensajeContainer, "success", `✅ ${result.mensaje}`);

      // Limpiar el formulario
      form.reset();

      // Cerrar el modal después de 1 segundo
      setTimeout(() => {
        cerrarModal(config.modal);
      }, 1000);

      // Restaurar elementos después de que el modal se haya cerrado
      setTimeout(() => {
        form.style.display = "block";
        const modal = document.getElementById(config.modal);
        const modalFooter = modal ? modal.querySelector(".modal-footer") : null;
        if (modalFooter) {
          modalFooter.style.display = "block";
        }
      }, 1500);
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
 * @param {Object} config - Configuración del formulario
 * @returns {boolean} - true si los datos son válidos
 */
function validarDatosFormulario(data, config) {
  // Usar camposRequeridos si está definido, de lo contrario usar todos los campos
  const camposAValidar = config.camposRequeridos || config.campos;

  // Validar que todos los campos requeridos estén llenos
  for (let campo of camposAValidar) {
    if (campo == "emailCrearCuenta") {
      campo = "email";
    } else if (campo == "passwordCrearCuenta") {
      campo = "password";
    } else if (campo == "emailIniciarSesion") {
      campo = "email";
    } else if (campo == "passwordIniciarSesion") {
      campo = "password";
    }

    if (!data[campo] || data[campo].length === 0) {
      return false;
    }
  }

  // Ejecutar validaciones específicas
  for (const [campo, validador] of Object.entries(config.validaciones)) {
    if (data[campo]) {
      // Si hay una contraseña, validarla primero
      if (campo === 'password') {
        if (!validador(data[campo])) {
          return false;
        }
      }
      // Luego validar otros campos
      else if (!validador(data[campo])) {
        return false;
      }
    }
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
 * @param {string} modalId - ID del modal que se está abriendo
 */
function limpiarMensajes(modalId) {
  const modal = document.getElementById(modalId);
  const mensajeContainer = modal
    ? modal.querySelector("#mensajeContainer, .alert")
    : null;
  if (mensajeContainer) {
    mensajeContainer.style.display = "none";
  }
}
