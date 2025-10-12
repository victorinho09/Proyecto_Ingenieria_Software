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

/**
 * Convierte un archivo a Base64
 * @param {File} archivo - Archivo a convertir
 * @returns {Promise<string>} - Promise que resuelve con la cadena Base64
 */
export function convertirArchivoABase64(archivo) {
  return new Promise((resolve, reject) => {
    if (!archivo) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
      resolve(event.target.result);
    };

    reader.onerror = function (error) {
      console.error("Error al leer archivo:", error);
      reject(new Error("Error al procesar la imagen"));
    };

    reader.readAsDataURL(archivo);
  });
}

/**
 * Valida un archivo de imagen en el cliente
 * @param {File} archivo - Archivo a validar
 * @returns {Object} - {valido: boolean, error: string}
 */
export function validarArchivoImagen(archivo) {
  if (!archivo) {
    return { valido: true, error: "" }; // Opcional, puede estar vacío
  }

  const tiposPermitidos = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  const tamañoMaximo = 5 * 1024 * 1024; // 5MB

  if (!tiposPermitidos.includes(archivo.type)) {
    return {
      valido: false,
      error: "Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP.",
    };
  }

  if (archivo.size > tamañoMaximo) {
    return {
      valido: false,
      error: "La imagen es muy grande. Tamaño máximo: 5MB.",
    };
  }

  return { valido: true, error: "" };
}

/**
 * Obtiene los datos de un formulario incluyendo archivos convertidos a Base64
 * @param {HTMLElement} form - El elemento formulario
 * @param {Array} campos - Array de nombres de campos a extraer
 * @returns {Promise<Object>} - Promise que resuelve con los datos del formulario
 */
export async function obtenerDatosFormularioConArchivos(form, campos) {
  const formData = {};

  for (const campo of campos) {
    const element = form[campo];
    if (element) {
      // Manejar archivos de imagen
      if (element.type === "file" && element.files && element.files[0]) {
        const archivo = element.files[0];

        // Validar archivo
        const validacion = validarArchivoImagen(archivo);
        if (!validacion.valido) {
          throw new Error(validacion.error);
        }

        try {
          // Convertir a Base64
          const base64 = await convertirArchivoABase64(archivo);
          formData[campo] = base64;
        } catch (error) {
          throw new Error(`Error al procesar la imagen: ${error.message}`);
        }
      } else {
        // Manejar campos normales con mapeo específico
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
    }
  }

  return formData;
}
