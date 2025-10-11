/**
 * Funciones de validación
 * Contiene todas las funciones de validación de datos del lado cliente
 */

/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {boolean} - true si la contraseña es válida
 */
export function validarPassword(password) {
  const longitud = password.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneMinuscula = /[a-z]/.test(password);
  const tieneNumero = /[0-9]/.test(password);

  return longitud && tieneMayuscula && tieneMinuscula && tieneNumero;
}

/**
 * Valida una contraseña y devuelve los errores específicos
 * @param {string} password - Contraseña a validar
 * @returns {Object} - {isValid: boolean, errors: string[]}
 */
export function validarPasswordConErrores(password) {
  const errors = [];

  if (!password || password.length === 0) {
    return { isValid: false, errors: ["La contraseña es requerida"] };
  }

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra mayúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra minúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe contener al menos un número");
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Valida un email usando expresión regular
 * @param {string} email - Email a validar
 * @returns {boolean} - true si el email es válido
 */
export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida un email y devuelve errores específicos
 * @param {string} email - Email a validar
 * @returns {Object} - {isValid: boolean, errors: string[]}
 */
export function validarEmailConErrores(email) {
  const errors = [];

  if (!email || email.length === 0) {
    return { isValid: false, errors: ["El email es requerido"] };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push(
      "El formato del email no es válido (ejemplo: usuario@dominio.com)"
    );
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Valida los datos del formulario del lado cliente
 * @param {Object} data - Datos del formulario
 * @param {Object} config - Configuración del formulario
 * @returns {boolean} - true si todos los datos son válidos
 */
export function validarDatosFormulario(data, config) {
  // Usar camposRequeridos si está definido, de lo contrario usar todos los campos
  const camposAValidar = config.camposRequeridos || config.campos;

  // Validar que todos los campos requeridos estén llenos
  for (let campo of camposAValidar) {
    let campoData = campo;

    // Mapear nombres de campos del formulario a nombres de datos
    if (campo === "emailCrearCuenta" || campo === "emailIniciarSesion") {
      campoData = "email";
    } else if (
      campo === "passwordCrearCuenta" ||
      campo === "passwordIniciarSesion"
    ) {
      campoData = "password";
    }

    if (!data[campoData] || data[campoData].length === 0) {
      return false;
    }
  }

  // Ejecutar validaciones específicas
  for (const [campo, validador] of Object.entries(config.validaciones)) {
    if (
      data[campo] &&
      typeof validador === "function" &&
      !validador(data[campo])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Valida los datos del formulario y devuelve errores específicos
 * @param {Object} data - Datos del formulario
 * @param {Object} config - Configuración del formulario
 * @returns {Object} - {isValid: boolean, errors: string[]}
 */
export function validarDatosFormularioConErrores(data, config) {
  const allErrors = [];

  // Usar camposRequeridos si está definido, de lo contrario usar todos los campos
  const camposAValidar = config.camposRequeridos || config.campos;

  // Validar que todos los campos requeridos estén llenos
  for (let campo of camposAValidar) {
    let campoData = campo;
    let nombreCampo = campo;

    // Mapear nombres de campos del formulario a nombres de datos y nombres legibles
    if (campo === "emailCrearCuenta" || campo === "emailIniciarSesion") {
      campoData = "email";
      nombreCampo = "Email";
    } else if (
      campo === "passwordCrearCuenta" ||
      campo === "passwordIniciarSesion"
    ) {
      campoData = "password";
      nombreCampo = "Contraseña";
    } else if (campo === "nombreUsuario") {
      nombreCampo = "Nombre de usuario";
    }

    if (!data[campoData] || data[campoData].length === 0) {
      allErrors.push(`${nombreCampo} es requerido`);
    }
  }

  // Ejecutar validaciones específicas con mensajes detallados
  for (const [campo, validador] of Object.entries(config.validaciones)) {
    if (data[campo]) {
      if (campo === "email") {
        const emailValidation = validarEmailConErrores(data[campo]);
        if (!emailValidation.isValid) {
          allErrors.push(...emailValidation.errors);
        }
      } else if (campo === "password") {
        const passwordValidation = validarPasswordConErrores(data[campo]);
        if (!passwordValidation.isValid) {
          allErrors.push(...passwordValidation.errors);
        }
      } else if (typeof validador === "function" && !validador(data[campo])) {
        allErrors.push(`${campo} no es válido`);
      }
    }
  }

  return { isValid: allErrors.length === 0, errors: allErrors };
}
