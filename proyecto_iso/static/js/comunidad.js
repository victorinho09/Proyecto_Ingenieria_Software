// comunidad.js - Funcionalidad específica para la página de comunidad

import {
  formatearDuracion,
  crearCardReceta,
  agregarEventListenersRecetas,
  mostrarLoadingModal,
  mostrarErrorModal,
  obtenerDetalleReceta,
  mostrarIngredientes,
  mostrarPasosAseguir,
  mostrarAlergenos,
  mostrarImagenReceta
} from './utils/recetas-utils.js';

/**
 * Abre el modal de detalle de una receta
 * @param {string} recetaId - ID de la receta a mostrar
 */
async function abrirModalDetalleReceta(recetaId) {
  const modal = new bootstrap.Modal(document.getElementById('detalleRecetaModal'));
  
  // Mostrar modal con loading
  mostrarLoadingModal();
  modal.show();
  
  try {
    const resultado = await obtenerDetalleReceta(recetaId);
    
    if (resultado.exito && resultado.receta) {
      mostrarDetalleReceta(resultado.receta);
    } else {
      mostrarErrorModal(resultado.mensaje || "No se pudo cargar la receta");
    }
  } catch (error) {
    mostrarErrorModal(error.message);
  }
}

/**
 * Muestra el detalle completo de una receta en el modal
 * @param {Object} receta - Objeto con los datos de la receta
 */
function mostrarDetalleReceta(receta) {
  // Ocultar loading y error, mostrar contenido
  document.getElementById('loadingDetalleReceta').style.display = 'none';
  document.getElementById('errorDetalleReceta').style.display = 'none';
  document.getElementById('contenidoDetalleReceta').style.display = 'block';

  // Llenar datos básicos
  document.getElementById('tituloRecetaDetalle').textContent = receta.nombreReceta || 'Sin nombre';
  document.getElementById('descripcionRecetaDetalle').textContent = receta.descripcion || 'Sin descripción';
  document.getElementById('duracionRecetaDetalle').textContent = formatearDuracion(receta.duracion || 0);
  document.getElementById('dificultadRecetaDetalle').textContent = receta.dificultad || 'No especificada';
  document.getElementById('paisOrigenRecetaDetalle').textContent = receta.paisOrigen || 'No especificado';
  
  // Formatear turno de comida
  const turnoComida = receta.turnoComida || 'No especificado';
  document.getElementById('turnoComidaRecetaDetalle').textContent = 
    turnoComida.charAt(0).toUpperCase() + turnoComida.slice(1).toLowerCase();

  // Mostrar imagen
  mostrarImagenReceta(
    receta.fotoReceta,
    receta.nombreReceta,
    document.getElementById('imagenRecetaDetalle')
  );

  // Mostrar ingredientes
  mostrarIngredientes(
    receta.ingredientes,
    document.getElementById('ingredientesRecetaDetalle')
  );

  // Mostrar pasos a seguir
  mostrarPasosAseguir(
    receta.pasosAseguir,
    document.getElementById('instruccionesRecetaDetalle')
  );

  // Mostrar alérgenos
  mostrarAlergenos(
    receta.alergenos,
    document.getElementById('alergenosRecetaDetalle')
  );

  // Configurar botón de guardar (sin funcionalidad por ahora)
  const btnGuardar = document.getElementById('guardarRecetaBtn');
  if (btnGuardar) {
    btnGuardar.onclick = function() {
      console.log('Guardar receta:', receta.nombreReceta);
      // TODO: Implementar funcionalidad de guardar receta
    };
  }
}

/**
 * Carga y muestra las recetas de la comunidad (todas excepto las del usuario actual)
 */
async function cargarRecetasComunidad() {
  try {
    const response = await fetch("/api/recetas-comunidad", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    const resultado = await response.json();
    const contenedor = document.getElementById("contenedorRecetas");
    const totalRecetas = document.getElementById("totalRecetas");

    if (resultado.exito && resultado.recetas) {
      const recetas = resultado.recetas;

      if (recetas.length === 0) {
        contenedor.innerHTML = `
          <div class="col-12 text-center py-5">
            <div class="text-muted">
              <i class="bi bi-journal-x" style="font-size: 3rem;"></i>
              <h5 class="mt-3">No hay recetas en la comunidad</h5>
              <p>¡Sé el primero en compartir una receta!</p>
            </div>
          </div>
        `;
        totalRecetas.textContent = "Sin recetas";
      } else {
        // Usar crearCardReceta con el parámetro mostrarAutor=true para comunidad
        contenedor.innerHTML = recetas.map(receta => crearCardReceta(receta, true)).join("");
        totalRecetas.textContent = `${recetas.length} receta${
          recetas.length !== 1 ? "s" : ""
        }`;
        
        // Agregar event listeners a las tarjetas de recetas
        agregarEventListenersRecetas(abrirModalDetalleReceta);
      }
    } else {
      contenedor.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="text-danger">
            <i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
            <h5 class="mt-3">Error al cargar recetas</h5>
            <p>${
              resultado.mensaje || "Ha ocurrido un error inesperado"
            }</p>
          </div>
        </div>
      `;
      totalRecetas.textContent = "Error";
    }
  } catch (error) {
    console.error("Error al cargar recetas:", error);
    document.getElementById("contenedorRecetas").innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="text-danger">
          <i class="bi bi-wifi-off" style="font-size: 3rem;"></i>
          <h5 class="mt-3">Error de conexión</h5>
          <p>No se pudieron cargar las recetas. Verifica tu conexión.</p>
        </div>
      </div>
    `;
    document.getElementById("totalRecetas").textContent = "Error";
  }
}

// Cargar recetas al cargar la página
document.addEventListener("DOMContentLoaded", cargarRecetasComunidad);
