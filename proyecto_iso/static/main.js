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
    mostrarErrorPassword(
      "La contraseña debe contener al menos una letra mayúscula"
    );
    return false;
  }
  if (!tieneMinuscula) {
    mostrarErrorPassword(
      "La contraseña debe contener al menos una letra minúscula"
    );
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
  const forms = ["crearCuentaForm", "iniciarSesionForm"];
  forms.forEach((formId) => {
    const form = document.getElementById(formId);
    if (form) {
      const config = CONFIGURACION_FORMULARIOS[formId];
      const modal = document.getElementById(config.modal);
      const mensajeContainer = modal
        ? modal.querySelector("#mensajeContainer, .alert")
        : null;
      if (mensajeContainer) {
        mostrarMensaje(mensajeContainer, "error", `❌ ${mensaje}`);
      }
    }
  });
}

// Función para detectar si el usuario está en modo invitado
/**
 * Verifica si el usuario es invitado consultando el servidor
 * @returns {Promise<boolean>} True si es usuario invitado
 */
async function esInvitado() {
  try {
    // Agregar timestamp para evitar caché del navegador
    const timestamp = Date.now();
    const response = await fetch(`/api/estado-usuario?t=${timestamp}`, {
      credentials: "same-origin", // Importante: incluir cookies en la petición y respuesta
      cache: "no-cache", // Forzar no usar caché
    });
    console.log(`[esInvitado] Response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(
        `[esInvitado] ✅ Estado del servidor: ${data.estado}, es_invitado: ${data.es_invitado}`
      );
      return data.es_invitado;
    } else {
      console.error(`[esInvitado] ❌ Error del servidor: ${response.status}`);
    }

    // Fallback: usar lógica de URL si falla la consulta al servidor
    const pathname = window.location.pathname;
    const esRaiz = pathname === "/" || pathname === "";
    console.log(
      `[esInvitado] 🔄 Fallback - pathname: "${pathname}", esRaiz: ${esRaiz}`
    );
    return esRaiz;
  } catch (error) {
    console.error("Error al verificar estado del usuario:", error);
    // Fallback: usar lógica de URL
    const pathname = window.location.pathname;
    return pathname === "/" || pathname === "";
  }
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

document.addEventListener("DOMContentLoaded", async function () {
  // Inicializar event listeners cuando el DOM esté cargado
  console.log("DOM cargado");

  // Verificar estado del usuario al cargar la página (esto establece la cookie inicial)
  console.log("🔍 Verificando estado inicial del usuario...");
  await esInvitado();

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
    // Asegurar que el texto de campos obligatorios siga visible
    const textoObligatorio = modal.querySelector(".text-danger");
    if (textoObligatorio) {
      textoObligatorio.style.display = "block";
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
      credentials: "same-origin", // Importante: incluir cookies en formularios
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok && result.exito) {
      // Verificar si es un login o logout exitoso para redirigir
      if (
        config.endpoint === "/iniciar-sesion" ||
        config.endpoint === "/cerrar-sesion"
      ) {
        // Para login y logout exitosos, mostrar mensaje y recargar
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

        // Redirigir según el tipo de operación
        setTimeout(() => {
          if (config.endpoint === "/iniciar-sesion") {
            // Login: asegurar redirección limpia sin query parameters problemáticos
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
          } else if (config.endpoint === "/cerrar-sesion") {
            // Logout: limpiar caché y redirigir a página principal como invitado
            window.location.href = "/?logout=true&t=" + Date.now();
          }
        }, 1500);

        return; // Salir temprano para evitar el comportamiento normal del modal
      }

      // Comportamiento normal para otros casos (crear cuenta, etc.)
      // Ocultar el formulario y el texto de campos obligatorios
      form.style.display = "none";
      const textoObligatorio = modal.querySelector(".text-danger");
      if (textoObligatorio) {
        textoObligatorio.style.display = "none";
      }

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
        // Usar la función existente para restablecer todo el estado
        limpiarMensajes(config.modal);
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
      if (campo === "password") {
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
 * Limpia los mensajes cuando se abre el modal y restablece el estado inicial
 * @param {string} modalId - ID del modal que se está abriendo
 */
function limpiarMensajes(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  // Limpiar mensajes de alerta
  const mensajeContainer = modal.querySelector("#mensajeContainer, .alert");
  if (mensajeContainer) {
    mensajeContainer.style.display = "none";
  }

  // Restablecer el formulario a su estado visible
  const form = modal.querySelector("form");
  if (form) {
    form.style.display = "block";
  }

  // Restablecer texto de campos obligatorios
  const textoObligatorio = modal.querySelector(".text-danger");
  if (textoObligatorio) {
    textoObligatorio.style.display = "block";
  }

  // Restablecer los botones del modal
  const modalFooter = modal.querySelector(".modal-footer");
  if (modalFooter) {
    modalFooter.style.display = "block";
  }
}
