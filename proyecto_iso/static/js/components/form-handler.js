/**
 * Manejador de formularios
 * Contiene la lógica para manejar todos los formularios de la aplicación
 */

import { CONFIGURACION_FORMULARIOS } from "../config/forms-config.js";
import {
  validarDatosFormulario,
  validarDatosFormularioConErrores,
  validarEmailConErrores,
  validarPasswordConErrores,
} from "../utils/validators.js";
import {
  obtenerDatosFormulario,
  manejarEstadoBoton,
  obtenerBotonSubmit,
} from "../utils/dom-utils.js";
import {
  iniciarSesion,
  cerrarSesion,
  crearCuenta,
} from "../services/auth-service.js";
import { crearReceta } from "../services/api-service.js";
import { mostrarMensaje } from "./message-handler.js";

/**
 * Maneja el envío de formularios
 * @param {Event} event - Evento del formulario
 */
export async function manejarEnvioFormulario(event) {
  event.preventDefault();

  const form = event.target;
  const formId = form.id;
  const config = CONFIGURACION_FORMULARIOS[formId];

  if (!config) {
    console.error(`No se encontró configuración para el formulario: ${formId}`);
    return;
  }

  const button = obtenerBotonSubmit(form);
  const data = obtenerDatosFormulario(form, config.campos);

  // Validación específica por tipo de formulario
  if (formId === "iniciarSesionForm") {
    // INICIO DE SESIÓN: Solo validación básica por seguridad
    // No revelamos información sobre formatos o requisitos de contraseña
    if (
      !data.email ||
      !data.password ||
      data.email.trim() === "" ||
      data.password.trim() === ""
    ) {
      mostrarMensaje("Por favor, completa todos los campos.", "error");
      return;
    }
  } else if (formId === "cerrarSesionForm") {
    // CERRAR SESIÓN: No necesita validación
    // Se procesa directamente
  } else {
    // OTROS FORMULARIOS (crear cuenta, crear receta, etc.): Validación detallada
    const validacion = validarDatosFormularioConErrores(data, config);
    if (!validacion.isValid) {
      const mensajeError =
        "❌ Errores encontrados:\n• " + validacion.errors.join("\n• ");
      mostrarMensaje(mensajeError, "error");
      return;
    }
  }

  // Deshabilitar botón durante el envío
  manejarEstadoBoton(button, true);

  try {
    let resultado;

    switch (formId) {
      case "crearCuentaForm":
        resultado = await crearCuenta(data);
        if (resultado.success) {
          mostrarMensaje(
            `✅ ${
              resultado.data.mensaje || "Cuenta creada exitosamente"
            } Redirigiendo...`,
            "success"
          );
          return;
        }
        break;

      case "iniciarSesionForm":
        // El login tiene comportamiento especial - muestra mensaje y redirige
        resultado = await iniciarSesion(data);
        if (resultado.success) {
          mostrarMensaje(
            `✅ ${
              resultado.data.mensaje || "Inicio de sesión exitoso"
            } Redirigiendo...`,
            "success"
          );
          return;
        }
        break;

      case "cerrarSesionForm":
        // El logout tiene comportamiento especial - redirige inmediatamente
        resultado = await cerrarSesion();
        // La función cerrarSesion() ya maneja la redirección, no continuamos
        return;

      case "crearRecetaForm":
        resultado = await crearReceta(data);
        break;

      default:
        console.error(`Formulario no reconocido: ${formId}`);
        return;
    }

    // Manejar la respuesta
    if (resultado.success) {
      if (resultado.data.mensaje) {
        mostrarMensaje(resultado.data.mensaje, "success");
      }

      // Ejecutar callback si existe
      if (config.onSuccess && typeof config.onSuccess === "function") {
        config.onSuccess(resultado.data);
      }

      // Limpiar formulario si es necesario
      if (config.limpiarAlEnviar) {
        form.reset();
      }
    } else {
      const mensaje =
        resultado.data.mensaje ||
        "Ha ocurrido un error. Por favor, inténtalo de nuevo.";
      mostrarMensaje(mensaje, "error");
    }
  } catch (error) {
    console.error("Error en el envío del formulario:", error);
    mostrarMensaje(
      "Error de conexión. Por favor, inténtalo de nuevo.",
      "error"
    );
  } finally {
    // Rehabilitar botón
    manejarEstadoBoton(button, false);
  }
}

/**
 * Añade validación en tiempo real a un campo específico
 * @param {HTMLElement} campo - Campo del formulario
 * @param {string} tipoCampo - Tipo de campo (email, password, etc.)
 */
function añadirValidacionEnTiempoReal(campo, tipoCampo) {
  const mostrarErrorCampo = (errores) => {
    // Eliminar mensajes de error previos
    const errorPrevio = campo.parentNode.querySelector(".error-campo");
    if (errorPrevio) {
      errorPrevio.remove();
    }

    if (errores.length > 0) {
      // Crear elemento de error
      const errorElement = document.createElement("div");
      errorElement.className = "error-campo";
      errorElement.style.cssText = `
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        padding: 0.25rem;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 0.25rem;
      `;
      errorElement.innerHTML = errores
        .map((error) => `• ${error}`)
        .join("<br>");

      // Insertar después del campo
      campo.parentNode.insertBefore(errorElement, campo.nextSibling);

      // Añadir clase de error al campo
      campo.classList.add("is-invalid");
      campo.style.borderColor = "#dc3545";
    } else {
      // Remover clase de error
      campo.classList.remove("is-invalid");
      campo.style.borderColor = "";
    }
  };

  campo.addEventListener("blur", () => {
    const valor = campo.value.trim();
    if (valor) {
      let errores = [];

      if (tipoCampo === "email") {
        const validacion = validarEmailConErrores(valor);
        errores = validacion.errors;
      } else if (tipoCampo === "password") {
        const validacion = validarPasswordConErrores(valor);
        errores = validacion.errors;
      }

      mostrarErrorCampo(errores);
    }
  });

  // Limpiar errores cuando el usuario empieza a escribir
  campo.addEventListener("input", () => {
    const errorPrevio = campo.parentNode.querySelector(".error-campo");
    if (errorPrevio) {
      errorPrevio.remove();
      campo.classList.remove("is-invalid");
      campo.style.borderColor = "";
    }
  });
}

/**
 * Inicializa todos los formularios de la página
 */
export function inicializarFormularios() {
  Object.keys(CONFIGURACION_FORMULARIOS).forEach((formId) => {
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener("submit", manejarEnvioFormulario);

      if (formId === "iniciarSesionForm") {
        // SEGURIDAD CRÍTICA: Eliminar CUALQUIER validación previa del formulario de inicio de sesión
        const campos = form.querySelectorAll(
          'input[type="email"], input[type="password"]'
        );
        campos.forEach((campo) => {
          // Clonar el campo para eliminar todos los event listeners
          const nuevoCampo = campo.cloneNode(true);
          campo.parentNode.replaceChild(nuevoCampo, campo);

          // Limpiar cualquier mensaje de error visible
          const erroresExistentes = form.querySelectorAll(".error-campo");
          erroresExistentes.forEach((error) => error.remove());

          // Limpiar estilos de error
          nuevoCampo.classList.remove("is-invalid");
          nuevoCampo.style.borderColor = "";
        });

        console.log(
          `🔒 [SEGURIDAD] Validación eliminada del formulario: ${formId}`
        );
      } else if (
        formId === "crearCuentaForm" ||
        formId === "crearCuentaForm2"
      ) {
        // SOLO añadir validación en tiempo real para crear cuenta
        const campoEmail = form.querySelector('input[type="email"]');
        const campoPassword = form.querySelector('input[type="password"]');

        if (campoEmail) {
          añadirValidacionEnTiempoReal(campoEmail, "email");
        }

        if (campoPassword) {
          añadirValidacionEnTiempoReal(campoPassword, "password");
        }

        console.log(
          `✅ [VALIDACIÓN] Validación añadida al formulario: ${formId}`
        );
      }
    }
  });
}
