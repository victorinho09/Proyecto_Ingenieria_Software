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
      return; // CRÍTICO: Salir aquí para no continuar con el procesamiento
    }
  } else if (formId === "cerrarSesionForm") {
    // CERRAR SESIÓN: No necesita validación
    // Se procesa directamente
  } else if (formId === "crearCuentaForm" || formId === "crearCuentaForm2") {
    // CREAR CUENTA: Validación detallada con mensaje local (no flotante)
    const validacion = validarDatosFormularioConErrores(data, config);
    if (!validacion.isValid) {
      const mensajeError =
        "Errores encontrados: " + validacion.errors.join(", ");
      mostrarErrorLocalFormulario(form, mensajeError);
      return; // CRÍTICO: Salir aquí para no continuar con el procesamiento
    }
  } else {
    // OTROS FORMULARIOS (crear receta, etc.): Validación detallada con mensaje flotante
    const validacion = validarDatosFormularioConErrores(data, config);
    if (!validacion.isValid) {
      const mensajeError =
        "❌ Errores encontrados:\n• " + validacion.errors.join("\n• ");
      mostrarMensaje(mensajeError, "error");
      return; // CRÍTICO: Salir aquí para no continuar con el procesamiento
    }
  }

  // NO LIMPIAR ERRORES AQUÍ - Solo los limpia la validación inteligente cuando el campo es válido
  // limpiarErroresFormulario(form); // ELIMINADO para evitar parpadeos

  // Deshabilitar botón durante el envío
  manejarEstadoBoton(button, true);

  try {
    let resultado;

    switch (formId) {
      case "crearCuentaForm":
      case "crearCuentaForm2":
        resultado = await crearCuenta(data);
        if (resultado.success) {
          mostrarMensaje(
            `✅ ${
              resultado.data.mensaje || "Cuenta creada exitosamente"
            } Redirigiendo...`,
            "success"
          );
          return;
        } else {
          // Mostrar error de crear cuenta como mensaje local (no flotante)
          const mensajeError =
            resultado.data.mensaje || "Error al crear la cuenta";
          mostrarErrorLocalFormulario(form, mensajeError);
          return; // Salir para no ejecutar el manejo general de errores
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
        } else {
          // Mostrar error de login como mensaje local (no flotante)
          const mensajeError =
            resultado.data.mensaje || "Error de inicio de sesión";
          mostrarErrorLocalFormulario(form, mensajeError);
          return; // Salir para no ejecutar el manejo general de errores
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
 * Muestra un mensaje de error local en un formulario de forma consistente
 * Esta función es reutilizable para todos los formularios (login, crear cuenta, etc.)
 * @param {HTMLElement} form - Formulario donde mostrar el error
 * @param {string} mensaje - Mensaje de error a mostrar
 */
function mostrarErrorLocalFormulario(form, mensaje) {
  // Buscar error existente para evitar parpadeo innecesario
  const modal = form.closest(".modal");
  const contenedorCompleto = modal || form.parentNode || document;
  const errorExistente = contenedorCompleto.querySelector(".error-formulario");

  // Si ya existe el mismo mensaje, no hacer nada para evitar parpadeo
  if (errorExistente && errorExistente.textContent === mensaje) {
    console.log(
      `🔄 [ERROR LOCAL] Mensaje ya mostrado, manteniendo: ${mensaje}`
    );
    return;
  }

  // Si existe un error diferente, actualizar el contenido sin recrear el elemento
  if (errorExistente) {
    console.log(`🔄 [ERROR LOCAL] Actualizando mensaje: ${mensaje}`);
    errorExistente.textContent = mensaje;
    return;
  }

  // Solo crear nuevo elemento si no existe ningún error
  const errorElement = document.createElement("div");
  errorElement.className = "error-formulario";
  errorElement.style.cssText = `
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 0.25rem;
    text-align: left;
    opacity: 1;
  `;
  errorElement.textContent = mensaje;

  // Insertar el error en el lugar apropiado
  insertarErrorEnFormulario(form, errorElement);

  console.log(`✅ [ERROR LOCAL] Creado nuevo mensaje: ${mensaje}`);
}

/**
 * Limpia todos los errores de formulario de forma inmediata
 * @param {HTMLElement} form - Formulario del que limpiar errores
 */
function limpiarErroresFormulario(form) {
  // Buscar el contenedor más amplio (modal completo si existe, o el formulario)
  const modal = form.closest(".modal");
  const contenedorCompleto = modal || form.parentNode || document;

  // Encontrar todos los errores previos
  const erroresPrevios =
    contenedorCompleto.querySelectorAll(".error-formulario");

  if (erroresPrevios.length > 0) {
    erroresPrevios.forEach((error) => {
      // Eliminación inmediata - no más setTimeout que causa problemas
      error.remove();
    });

    console.log(
      `🧹 [LIMPIEZA] Eliminando ${erroresPrevios.length} errores previos`
    );
  }
}

/**
 * Limpia todos los errores de formulario de forma instantánea (para reemplazos)
 * @param {HTMLElement} form - Formulario del que limpiar errores
 */
function limpiarErroresFormularioInstantaneo(form) {
  // Buscar el contenedor más amplio (modal completo si existe, o el formulario)
  const modal = form.closest(".modal");
  const contenedorCompleto = modal || form.parentNode || document;

  // Encontrar todos los errores previos
  const erroresPrevios =
    contenedorCompleto.querySelectorAll(".error-formulario");

  if (erroresPrevios.length > 0) {
    erroresPrevios.forEach((error) => {
      // Eliminación instantánea cuando se va a reemplazar inmediatamente
      error.remove();
    });

    console.log(
      `🧹 [LIMPIEZA INSTANTÁNEA] Eliminando ${erroresPrevios.length} errores previos`
    );
  }
}

/**
 * Inserta un elemento de error en el lugar apropiado del formulario
 * @param {HTMLElement} form - Formulario donde insertar
 * @param {HTMLElement} errorElement - Elemento de error a insertar
 */
function insertarErrorEnFormulario(form, errorElement) {
  const modalBody = form.closest(".modal-body");
  const contenedor = modalBody || form;

  // Buscar el lugar apropiado para insertar (después de los campos pero antes de los botones)
  const modalFooter = contenedor.querySelector(".modal-footer");
  const submitButton = contenedor.querySelector('button[type="submit"]');

  if (modalFooter) {
    // Si hay modal footer, insertar antes del footer
    modalFooter.parentNode.insertBefore(errorElement, modalFooter);
  } else if (submitButton) {
    // Si no hay footer pero hay botón submit, insertar antes del botón
    submitButton.parentNode.insertBefore(errorElement, submitButton);
  } else {
    // Como último recurso, añadir al final del contenedor
    contenedor.appendChild(errorElement);
  }
}

/**
 * Valida un formulario completo y limpia errores solo si todo es válido
 * @param {HTMLElement} form - Formulario a validar
 */
function validarYLimpiarErroresInteligente(form) {
  const formId = form.id;
  const config = CONFIGURACION_FORMULARIOS[formId];

  if (!config) return;

  const data = obtenerDatosFormulario(form, config.campos);
  const validacion = validarDatosFormularioConErrores(data, config);

  // Solo limpiar errores de formulario si TODO es válido
  if (validacion.isValid) {
    console.log(
      `✅ [VALIDACIÓN INTELIGENTE] Formulario válido, limpiando errores`
    );
    limpiarErroresFormulario(form);
  } else {
    console.log(
      `❌ [VALIDACIÓN INTELIGENTE] Formulario inválido, manteniendo errores: ${validacion.errors.join(
        ", "
      )}`
    );
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

      // Validar también el formulario completo para limpiar errores generales si todo es válido
      const form = campo.closest("form");
      if (form) {
        validarYLimpiarErroresInteligente(form);
      }
    }
  });

  // Limpiar errores de campo individual cuando el usuario empieza a escribir
  campo.addEventListener("input", () => {
    const errorPrevio = campo.parentNode.querySelector(".error-campo");
    if (errorPrevio) {
      errorPrevio.remove();
      campo.classList.remove("is-invalid");
      campo.style.borderColor = "";
    }

    // Validar también el formulario completo para limpiar errores generales si todo es válido
    const form = campo.closest("form");
    if (form) {
      validarYLimpiarErroresInteligente(form);
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

          // Añadir listener para validación inteligente cuando el usuario escriba
          nuevoCampo.addEventListener("input", () => {
            validarYLimpiarErroresInteligente(form);
          });
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
        const todosCampos = form.querySelectorAll("input");

        if (campoEmail) {
          añadirValidacionEnTiempoReal(campoEmail, "email");
        }

        if (campoPassword) {
          añadirValidacionEnTiempoReal(campoPassword, "password");
        }

        // Añadir listener para validación inteligente cuando el usuario escriba en cualquier campo
        todosCampos.forEach((campo) => {
          campo.addEventListener("input", () => {
            validarYLimpiarErroresInteligente(form);
          });
        });

        console.log(
          `✅ [VALIDACIÓN] Validación añadida al formulario: ${formId}`
        );
      }
    }
  });
}
