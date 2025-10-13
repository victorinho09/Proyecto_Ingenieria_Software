// Función para validar contraseñas
function validarPassword(password) {
  const tieneMinimo8Chars = password.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneMinuscula = /[a-z]/.test(password);
  const tieneNumero = /[0-9]/.test(password);

  return {
    esValida: tieneMinimo8Chars && tieneMayuscula && tieneMinuscula && tieneNumero,
    errores: {
      longitud: !tieneMinimo8Chars ? "La contraseña debe tener al menos 8 caracteres" : null,
      mayuscula: !tieneMayuscula ? "La contraseña debe contener al menos una letra mayúscula" : null,
      minuscula: !tieneMinuscula ? "La contraseña debe contener al menos una letra minúscula" : null,
      numero: !tieneNumero ? "La contraseña debe contener al menos un número" : null
    }
  };
}

// Validador de email local (mismas reglas que el validador central)
function validarEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const valor = email.trim();

  const atMatches = valor.match(/@/g) || [];
  if (atMatches.length !== 1) return false;

  const partes = valor.split('@');
  const local = partes[0] || '';
  const dominio = (partes[1] || '').toLowerCase();

  if (local.length < 8) return false;
  if (!/^[A-Za-z0-9.]+$/.test(local)) return false;

  const dominiosPermitidos = ['outlook.com','hotmail.com','gmail.com','icloud.com','ceu.es', 'usp.ceu.es'];
  if (!dominiosPermitidos.includes(dominio)) return false;

  return true;
}

// Configuración de formularios por ID
const CONFIGURACION_FORMULARIOS = {
  crearCuentaForm: {
    endpoint: "/crear-cuenta",
    modal: "crearCuentaModal",
    campos: ["nombreUsuario", "email", "password"],
    validaciones: {
      email: validarEmail,
      password: validarPassword,
    },
  },
  iniciarSesionForm: {
    endpoint: "/iniciar-sesion",
    modal: "iniciarSesionModal",
    campos: ["email", "password"],
    validaciones: {
      email: validarEmail,
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
    campos: ["nombreReceta", "descripcion", "ingredientes", "alergenos", "paisOrigen", "pasosAseguir", "turnoComida", "duracion", "dificultad", "fotoReceta"],
    validaciones: {},
  },
};

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar event listeners cuando el DOM esté cargado
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
      formData[campo] = element.value.trim();
    }
  });

  // Validación básica del lado cliente
  const validacion = validarDatosFormulario(formData, config);
  if (!validacion.valido) {
    mostrarMensaje(
      mensajeContainer,
      "error",
      "❌ " + validacion.mensaje.replace(/\n/g, '<br>')
    );
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
      // Ocultar el formulario
      form.style.display = "none";

      // Ocultar los botones del footer del modal específico
      const modal = document.getElementById(config.modal);
      const modalFooter = modal ? modal.querySelector(".modal-footer") : null;
      if (modalFooter) {
        modalFooter.style.display = "none";
      }

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
  // Validar que todos los campos requeridos estén llenos
  for (const campo of config.campos) {
    if (!data[campo] || data[campo].length === 0) {
      return {
        valido: false,
        mensaje: "Por favor, completa todos los campos requeridos."
      };
    }
  }

  // Ejecutar validaciones específicas
  for (const [campo, validador] of Object.entries(config.validaciones)) {
    if (data[campo]) {
      if (campo === 'password') {
        const resultado = validador(data[campo]);
        if (!resultado.esValida) {
          // Recoger todos los mensajes de error de la contraseña
          const mensajesError = Object.values(resultado.errores)
            .filter(error => error !== null)
            .join('\n');
          return {
            valido: false,
            mensaje: mensajesError
          };
        }
      } else if (!validador(data[campo])) {
        return {
          valido: false,
          mensaje: "El formato del campo " + campo + " no es válido."
        };
      }
    }
  }

  return {
    valido: true,
    mensaje: ""
  };
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
