/**
 * Utilidades compartidas para recetas
 * Funciones reutilizables entre diferentes páginas de recetas
 */

/**
 * Formatea la duración de una receta en formato legible
 * @param {number} duracion - Duración en minutos
 * @returns {string} - Duración formateada (ej: "45 min" o "2h 30min")
 */
export function formatearDuracion(duracion) {
  if (duracion < 60) {
    return `${duracion} min`;
  } else {
    const horas = Math.floor(duracion / 60);
    const minutos = duracion % 60;
    return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
  }
}

/**
 * Crea el HTML de una card de receta
 * @param {Object} receta - Objeto con los datos de la receta
 * @param {boolean} mostrarAutor - Si se debe mostrar el autor de la receta
 * @returns {string} - HTML de la card
 */
export function crearCardReceta(receta, mostrarAutor = false) {
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card shadow-sm border-0 h-100 receta-card" 
           data-receta-id="${receta.id || receta._id || ''}"
           data-receta-nombre="${receta.nombreReceta || ''}"
           style="cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;"
           onmouseenter="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'"
           onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.1)'">
        <div class="card-img-top bg-light d-flex align-items-center justify-content-center position-relative" style="height: 200px;">
          ${
            receta.fotoReceta && receta.fotoReceta.trim() !== ""
              ? `<img src="${receta.fotoReceta}" class="img-fluid rounded-top w-100 h-100" style="object-fit: cover;" alt="${receta.nombreReceta}" loading="lazy">`
              : `<div class="d-flex flex-column align-items-center justify-content-center text-muted">
                   <i class="bi bi-image" style="font-size: 3rem;"></i>
                   <small class="mt-2">Sin imagen</small>
                 </div>`
          }
          <!-- Botón de guardar en la card -->
          <button class="btn btn-light btn-sm position-absolute top-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center btn-guardar-card shadow-sm" 
                  data-receta-nombre="${receta.nombreReceta || ''}"
                  style="width: 40px; height: 40px; z-index: 10; border: none; transition: all 0.2s ease;"
                  onclick="event.stopPropagation();"
                  title="Guardar receta">
            <i class="bi bi-bookmark fs-5"></i>
          </button>
        </div>
        <div class="card-body d-flex flex-column">
          <h6 class="card-title fw-bold mb-1">${receta.nombreReceta}</h6>
          ${
            mostrarAutor
              ? `<p class="text-muted small mb-2">
                   <i class="bi bi-person-circle me-1"></i>${receta.usuario || 'Autor desconocido'}
                 </p>`
              : ''
          }
          
          <p class="card-text text-muted small mb-3" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${receta.descripcion}
          </p>
          
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center text-muted small">
                <i class="bi bi-clock me-1"></i>
                <span>${formatearDuracion(receta.duracion)}</span>
              </div>
              <small class="text-primary fw-bold">Ver más →</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Agrega event listeners a las tarjetas de recetas para abrir el modal
 * @param {Function} callbackAbrirModal - Función a llamar cuando se hace click en una receta
 */
export function agregarEventListenersRecetas(callbackAbrirModal) {
  document.querySelectorAll('.receta-card').forEach(card => {
    card.addEventListener('click', function() {
      const recetaId = this.getAttribute('data-receta-id');
      if (recetaId && callbackAbrirModal) {
        callbackAbrirModal(recetaId);
      }
    });
  });
}

/**
 * Muestra el estado de loading en el modal de detalle
 */
export function mostrarLoadingModal() {
  document.getElementById('loadingDetalleReceta').style.display = 'block';
  document.getElementById('contenidoDetalleReceta').style.display = 'none';
  document.getElementById('errorDetalleReceta').style.display = 'none';
  document.getElementById('tituloRecetaDetalle').textContent = 'Cargando...';
}

/**
 * Muestra un error en el modal de detalle
 * @param {string} mensaje - Mensaje de error a mostrar
 */
export function mostrarErrorModal(mensaje) {
  document.getElementById('loadingDetalleReceta').style.display = 'none';
  document.getElementById('contenidoDetalleReceta').style.display = 'none';
  document.getElementById('errorDetalleReceta').style.display = 'block';
  document.getElementById('mensajeErrorDetalle').textContent = mensaje;
  document.getElementById('tituloRecetaDetalle').textContent = 'Error';
}

/**
 * Muestra los ingredientes de una receta en el modal
 * @param {string} ingredientes - String con los ingredientes separados por comas
 * @param {HTMLElement} contenedor - Elemento donde mostrar los ingredientes
 */
export function mostrarIngredientes(ingredientes, contenedor) {
  if (ingredientes && ingredientes.trim() !== '') {
    const ingredientesLista = ingredientes.split(',').map(ing => ing.trim()).filter(ing => ing);
    if (ingredientesLista.length > 0) {
      const ingredientesHTML = ingredientesLista.map((ingrediente, index) => {
        return `
          <div class="d-flex align-items-center mb-2">
            <span class="badge bg-success bg-opacity-10 text-success me-2">${index + 1}</span>
            <span class="fw-medium">${ingrediente}</span>
          </div>
        `;
      }).join('');
      contenedor.innerHTML = ingredientesHTML;
    } else {
      contenedor.innerHTML = '<p class="text-muted mb-0">No se han especificado ingredientes.</p>';
    }
  } else {
    contenedor.innerHTML = '<p class="text-muted mb-0">No se han especificado ingredientes.</p>';
  }
}

/**
 * Muestra los pasos a seguir de una receta en el modal
 * @param {string} pasosAseguir - String con los pasos
 * @param {HTMLElement} contenedor - Elemento donde mostrar los pasos
 */
export function mostrarPasosAseguir(pasosAseguir, contenedor) {
  if (pasosAseguir && pasosAseguir.trim() !== '') {
    // Primero intentar separar por saltos de línea
    let pasos = pasosAseguir.split(/[\n\r]+/).map(p => p.trim()).filter(p => p);
    
    // Si solo hay un paso, intentar separar por puntos (pero no el punto final)
    if (pasos.length <= 1) {
      const textoSinPuntoFinal = pasosAseguir.replace(/\.$/, '');
      pasos = textoSinPuntoFinal.split('.').map(p => p.trim()).filter(p => p);
    }
    
    // Si hay múltiples pasos, mostrarlos numerados
    if (pasos.length > 1) {
      const pasosHTML = pasos.map((paso, index) => {
        return `
          <div class="d-flex mb-3">
            <span class="badge bg-warning bg-opacity-10 text-warning me-3 mt-1" style="min-width: 24px;">${index + 1}</span>
            <p class="mb-0">${paso}</p>
          </div>
        `;
      }).join('');
      
      contenedor.innerHTML = pasosHTML;
    } else {
      // Si es un solo paso, mostrarlo sin numeración
      const pasosFormateados = pasosAseguir.replace(/\n/g, '<br>');
      contenedor.innerHTML = `<p class="mb-0">${pasosFormateados}</p>`;
    }
  } else {
    contenedor.innerHTML = '<p class="text-muted mb-0">No se han especificado pasos a seguir.</p>';
  }
}

/**
 * Muestra los alérgenos de una receta en el modal
 * @param {string} alergenos - String con los alérgenos
 * @param {HTMLElement} contenedor - Elemento donde mostrar los alérgenos
 */
export function mostrarAlergenos(alergenos, contenedor) {
  if (alergenos && alergenos.trim() !== '') {
    contenedor.innerHTML = `<p class="text-danger mb-0"><strong>${alergenos}</strong></p>`;
  } else {
    contenedor.innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i>Sin alérgenos conocidos</span>';
  }
}

/**
 * Muestra la imagen de una receta en el modal
 * @param {string} fotoReceta - URL de la foto o base64
 * @param {string} nombreReceta - Nombre de la receta para el alt
 * @param {HTMLElement} contenedor - Elemento donde mostrar la imagen
 */
export function mostrarImagenReceta(fotoReceta, nombreReceta, contenedor) {
  if (fotoReceta && fotoReceta.trim() !== "") {
    contenedor.innerHTML = `
      <img src="${fotoReceta}" 
           class="img-fluid rounded w-100 h-100" 
           style="object-fit: cover;" 
           alt="${nombreReceta}" 
           loading="lazy">
    `;
  } else {
    contenedor.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center text-muted h-100">
        <i class="bi bi-image" style="font-size: 4rem;"></i>
        <small class="mt-2">Sin imagen</small>
      </div>
    `;
  }
}

/**
 * Obtiene los detalles de una receta desde la API
 * @param {string} recetaId - ID de la receta
 * @returns {Promise<Object>} - Respuesta con los datos de la receta
 */
export async function obtenerDetalleReceta(recetaId) {
  try {
    const response = await fetch(`/api/receta/${recetaId}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    const resultado = await response.json();
    return resultado;
  } catch (error) {
    console.error("Error al cargar detalle de receta:", error);
    throw new Error("Error de conexión. No se pudo cargar la receta.");
  }
}
