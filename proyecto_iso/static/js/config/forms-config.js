/**
 * Configuración de formularios
 * Centraliza la configuración de todos los formularios de la aplicación
 */

import { ENDPOINTS } from "./constants.js";
import { validarPassword } from "../utils/validators.js";

export const CONFIGURACION_FORMULARIOS = {
  crearCuentaForm: {
    endpoint: ENDPOINTS.CREAR_CUENTA,
    modal: "crearCuentaModal",
    campos: ["nombreUsuario", "emailCrearCuenta", "passwordCrearCuenta"],
    validaciones: {
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      password: validarPassword,
    },
  },

  iniciarSesionForm: {
    endpoint: ENDPOINTS.INICIAR_SESION,
    modal: "iniciarSesionModal",
    campos: ["emailIniciarSesion", "passwordIniciarSesion"],
    validaciones: {}, // Sin validaciones por seguridad - solo validar si la cuenta existe
  },

  cerrarSesionForm: {
    endpoint: ENDPOINTS.CERRAR_SESION,
    modal: "cerrarSesionModal",
    campos: [],
    validaciones: {},
  },

  crearCuentaForm2: {
    endpoint: ENDPOINTS.CREAR_CUENTA,
    modal: null, // Formulario sin modal
    campos: ["nombreUsuario", "emailCrearCuenta", "passwordCrearCuenta"],
    validaciones: {
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      password: validarPassword,
    },
  },

  crearRecetaForm: {
    endpoint: ENDPOINTS.CREAR_RECETA,
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
