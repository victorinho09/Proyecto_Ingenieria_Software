/**
 * Utilidades de DOM y UI
 * Funciones para manipulación del DOM y elementos de la interfaz
 */

/**
 * Obtiene los datos de un formulario basándose en su configuración
 * @param {HTMLElement} form - El elemento formulario
 * @param {Array} campos - Array de nombres de campos a extraer
 * @returns {Object} - Objeto con los datos del formulario
 */
export function obtenerDatosFormulario(form, campos) {
  const formData = {};
  campos.forEach((campo) => {
    const element = form[campo];
    if (element) {
      // Mapeo de campos específicos para compatibilidad con el servidor
      if (
        element.id === "emailCrearCuenta" ||
        element.id === "emailIniciarSesion"
      ) {
        formData["email"] = element.value.trim();
      } else if (
        element.id === "passwordCrearCuenta" ||
        element.id === "passwordIniciarSesion"
      ) {
        formData["password"] = element.value.trim();
      } else {
        formData[campo] = element.value.trim();
      }
    }
  });
  return formData;
}

/**
 * Limpia un formulario
 * @param {HTMLFormElement} form - Elemento del formulario a limpiar
 */
export function limpiarFormulario(form) {
  form.reset();
}

/**
 * Busca el botón de submit en un formulario
 * @param {HTMLFormElement} form - Elemento del formulario
 * @returns {HTMLButtonElement|null} - Elemento del botón o null si no se encuentra
 */
export function obtenerBotonSubmit(form) {
  return form.querySelector("button[type='submit']");
}

/**
 * Deshabilita un botón
 * @param {HTMLButtonElement} button - Botón a deshabilitar
 * @param {string} textoDeshabilitado - Texto a mostrar mientras está deshabilitado
 */
export function deshabilitarBoton(button, textoDeshabilitado = "Enviando...") {
  if (button) {
    button.disabled = true;
    button.dataset.textoOriginal = button.textContent;
    button.textContent = textoDeshabilitado;
  }
}

/**
 * Habilita un botón previamente deshabilitado
 * @param {HTMLButtonElement} button - Botón a habilitar
 */
export function habilitarBoton(button) {
  if (button) {
    button.disabled = false;
    if (button.dataset.textoOriginal) {
      button.textContent = button.dataset.textoOriginal;
      delete button.dataset.textoOriginal;
    }
  }
}

/**
 * Gestiona el estado de carga de un botón
 * @param {HTMLButtonElement} button - Botón a manejar
 * @param {boolean} cargando - true para mostrar estado de carga, false para restaurar
 * @param {string} textoDeshabilitado - Texto a mostrar durante la carga
 */
export function manejarEstadoBoton(
  button,
  cargando,
  textoDeshabilitado = "Enviando..."
) {
  if (cargando) {
    deshabilitarBoton(button, textoDeshabilitado);
  } else {
    habilitarBoton(button);
  }
}
