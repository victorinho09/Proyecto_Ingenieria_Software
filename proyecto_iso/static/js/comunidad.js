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
import { mostrarMensaje } from './components/message-handler.js';

// Variable global para almacenar todas las recetas cargadas
let todasLasRecetasComunidad = [];

// Arrays para almacenar los tags de ingredientes y alérgenos
let ingredientesTagsComunidad = [];
let alergenosTagsComunidad = [];

/**
 * Agrega un tag de ingrediente o alérgeno
 * @param {string} tipo - 'ingrediente' o 'alergeno'
 * @param {string} valor - Valor del tag
 */
window.agregarTag = function(tipo, valor) {
  valor = valor.trim();
  if (!valor) return;
  
  if (tipo === 'ingrediente') {
    if (!ingredientesTagsComunidad.includes(valor)) {
      ingredientesTagsComunidad.push(valor);
      actualizarTagsUI('ingredientes');
    }
  } else if (tipo === 'alergeno') {
    if (!alergenosTagsComunidad.includes(valor)) {
      alergenosTagsComunidad.push(valor);
      actualizarTagsUI('alergenos');
    }
  }
}

/**
 * Elimina un tag de ingrediente o alérgeno
 * @param {string} tipo - 'ingrediente' o 'alergeno'
 * @param {string} valor - Valor del tag a eliminar
 */
window.eliminarTag = function(tipo, valor) {
  if (tipo === 'ingrediente') {
    ingredientesTagsComunidad = ingredientesTagsComunidad.filter(tag => tag !== valor);
    actualizarTagsUI('ingredientes');
  } else if (tipo === 'alergeno') {
    alergenosTagsComunidad = alergenosTagsComunidad.filter(tag => tag !== valor);
    actualizarTagsUI('alergenos');
  }
}

/**
 * Actualiza la UI de los tags
 * @param {string} tipo - 'ingredientes' o 'alergenos'
 */
function actualizarTagsUI(tipo) {
  const containerId = tipo === 'ingredientes' ? 'ingredientesTags' : 'alergenosTags';
  const container = document.getElementById(containerId);
  const tags = tipo === 'ingredientes' ? ingredientesTagsComunidad : alergenosTagsComunidad;
  const tipoSingular = tipo === 'ingredientes' ? 'ingrediente' : 'alergeno';
  
  if (!container) return;
  
  container.innerHTML = tags.map(tag => `
    <span class="filter-tag">
      ${tag}
      <button type="button" class="remove-tag" onclick="eliminarTag('${tipoSingular}', '${tag}')">×</button>
    </span>
  `).join('');
}

/**
 * Abre el modal de detalle de una receta
 * @param {string} recetaId - ID de la receta a mostrar
 */
async function abrirModalDetalleReceta(recetaId) {
  const detalleModalEl = document.getElementById('detalleRecetaModal');
  const modal = detalleModalEl ? new bootstrap.Modal(detalleModalEl) : null;

  // Mostrar modal con loading
  try { mostrarLoadingModal(); } catch (e) {}
  if (modal) modal.show();
  
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

  // Guardar nombre e ID de receta para comentarios
  recetaActualNombre = receta.nombreReceta;
  recetaActualId = receta.id;
  console.log('📝 Receta cargada:', { nombre: recetaActualNombre, id: recetaActualId });

  // Llenar datos básicos
  document.getElementById('tituloRecetaDetalle').textContent = receta.nombreReceta || 'Sin nombre';
  
  // Agregar atributos de datos para referencia
  const tituloElement = document.getElementById('tituloRecetaDetalle');
  tituloElement.setAttribute('data-receta-nombre', receta.nombreReceta);
  tituloElement.setAttribute('data-receta-id', receta.id || '');
  
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

  // Configurar botón de guardar
  configurarBotonGuardar(receta);
  
  // Cargar comentarios y valoraciones
  if (receta.id) {
    cargarComentarios(receta.id);
    cargarValoraciones(receta.id, receta.nombreReceta);
  }
}

/**
 * Configura el botón de guardar/desguardar receta
 * @param {Object} receta - Objeto con los datos de la receta
 */
async function configurarBotonGuardar(receta) {
  const btnGuardar = document.getElementById('guardarRecetaBtn');
  if (!btnGuardar) return;

  // Verificar si la receta ya está guardada
  let estaGuardada = await verificarRecetaGuardada(receta.nombreReceta);
  
  actualizarEstadoBotonGuardar(btnGuardar, estaGuardada);
  
  // Configurar el evento click
  btnGuardar.onclick = async function() {
    if (estaGuardada) {
      // Desguardar la receta
      await desguardarReceta(receta.nombreReceta, btnGuardar);
      estaGuardada = false;
    } else {
      // Guardar la receta
      await guardarReceta(receta.nombreReceta, btnGuardar);
      estaGuardada = true;
    }
  };
}

/**
 * Verifica si una receta ya está guardada por el usuario
 * @param {string} nombreReceta - Nombre de la receta
 * @returns {Promise<boolean>} - true si está guardada, false si no
 */
async function verificarRecetaGuardada(nombreReceta) {
  try {
    const response = await fetch("/obtener-recetas-guardadas", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    const resultado = await response.json();
    
    if (resultado.exito && resultado.recetas) {
      return resultado.recetas.some(r => r.nombreReceta === nombreReceta);
    }
    
    return false;
  } catch (error) {
    console.error("Error al verificar receta guardada:", error);
    return false;
  }
}

/**
 * Guarda una receta para el usuario actual
 * @param {string} nombreReceta - Nombre de la receta a guardar
 * @param {HTMLElement} boton - Elemento del botón para actualizar su estado
 */
async function guardarReceta(nombreReceta, boton) {
  try {
    // Deshabilitar el botón mientras se procesa
    boton.disabled = true;
    
    const response = await fetch("/guardar-receta", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ nombreReceta: nombreReceta }),
    });

    const resultado = await response.json();

    if (resultado.exito) {
      // Actualizar el estado del botón a "guardada"
      actualizarEstadoBotonGuardar(boton, true);
      
      // También actualizar el icono en la card si existe
      actualizarIconoCardDesdModal(nombreReceta, true);
      
      // Mostrar mensaje de éxito
      console.log(`✅ Receta "${nombreReceta}" guardada correctamente`);
    } else {
      alert(resultado.mensaje || "No se pudo guardar la receta");
      boton.disabled = false;
    }
  } catch (error) {
    console.error("Error al guardar receta:", error);
    alert("Error al guardar la receta");
    boton.disabled = false;
  }
}

/**
 * Desguarda una receta para el usuario actual
 * @param {string} nombreReceta - Nombre de la receta a desguardar
 * @param {HTMLElement} boton - Elemento del botón para actualizar su estado
 */
async function desguardarReceta(nombreReceta, boton) {
  try {
    // Deshabilitar el botón mientras se procesa
    boton.disabled = true;
    
    const response = await fetch("/desguardar-receta", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ nombreReceta: nombreReceta }),
    });

    const resultado = await response.json();

    if (resultado.exito) {
      // Actualizar el estado del botón a "no guardada"
      actualizarEstadoBotonGuardar(boton, false);
      
      // También actualizar el icono en la card si existe
      actualizarIconoCardDesdModal(nombreReceta, false);
      
      // Mostrar mensaje de éxito
      console.log(`🗑️ Receta "${nombreReceta}" desguardada correctamente`);
    } else {
      alert(resultado.mensaje || "No se pudo desguardar la receta");
      boton.disabled = false;
    }
  } catch (error) {
    console.error("Error al desguardar receta:", error);
    alert("Error al desguardar la receta");
    boton.disabled = false;
  }
}

/**
 * Actualiza el icono de la card cuando se guarda/desguarda desde el modal
 * @param {string} nombreReceta - Nombre de la receta
 * @param {boolean} estaGuardada - true si está guardada
 */
function actualizarIconoCardDesdModal(nombreReceta, estaGuardada) {
  // Buscar el botón de la card con ese nombre de receta
  const botones = document.querySelectorAll('.btn-guardar-card');
  botones.forEach(boton => {
    if (boton.dataset.recetaNombre === nombreReceta) {
      actualizarEstadoBotonCard(boton, estaGuardada);
    }
  });
}

/**
 * Actualiza el aspecto del botón según el estado de guardado
 * @param {HTMLElement} boton - Elemento del botón
 * @param {boolean} estaGuardada - true si la receta está guardada
 */
function actualizarEstadoBotonGuardar(boton, estaGuardada) {
  if (estaGuardada) {
    // Estado: Ya guardada
    boton.innerHTML = '<i class="bi bi-bookmark-check-fill"></i> Guardada';
    boton.className = 'btn btn-success';
    boton.disabled = false;
  } else {
    // Estado: No guardada
    boton.innerHTML = '<i class="bi bi-bookmark-plus"></i> Guardar';
    boton.className = 'btn btn-warning';
    boton.disabled = false;
  }
}

/**
 * Configura los botones de guardar en las cards de recetas
 */
async function configurarBotonesGuardarCards() {
  const botones = document.querySelectorAll('.btn-guardar-card');
  
  // Obtener lista de recetas guardadas del usuario
  const recetasGuardadas = await obtenerRecetasGuardadas();
  
  botones.forEach(async (boton) => {
    const nombreReceta = boton.getAttribute('data-receta-nombre');
    
    // Verificar si esta receta ya está guardada
    const estaGuardada = recetasGuardadas.includes(nombreReceta);
    
    // Actualizar estado visual del botón
    actualizarEstadoBotonCard(boton, estaGuardada);
    
    // Añadir evento click
    boton.addEventListener('click', async (e) => {
      e.stopPropagation(); // Evitar que se abra el modal
      
      const estadoActual = boton.getAttribute('data-guardada') === 'true';
      
      if (estadoActual) {
        // Desguardar
        await desguardarRecetaCard(nombreReceta, boton);
      } else {
        // Guardar
        await guardarRecetaCard(nombreReceta, boton);
      }
    });
  });
}

/**
 * Obtiene la lista de nombres de recetas guardadas por el usuario
 * @returns {Promise<Array<string>>} Array con los nombres de las recetas guardadas
 */
async function obtenerRecetasGuardadas() {
  try {
    const response = await fetch("/obtener-recetas-guardadas", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    const resultado = await response.json();
    
    if (resultado.exito && resultado.recetas) {
      return resultado.recetas.map(r => r.nombreReceta);
    }
    
    return [];
  } catch (error) {
    console.error("Error al obtener recetas guardadas:", error);
    return [];
  }
}

/**
 * Guarda una receta desde el botón en la card
 * @param {string} nombreReceta - Nombre de la receta a guardar
 * @param {HTMLElement} boton - Elemento del botón
 */
async function guardarRecetaCard(nombreReceta, boton) {
  try {
    // Deshabilitar el botón mientras se procesa
    boton.disabled = true;
    
    const response = await fetch("/guardar-receta", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ nombreReceta: nombreReceta }),
    });

    const resultado = await response.json();

    if (resultado.exito) {
      // Actualizar el estado del botón a "guardada"
      actualizarEstadoBotonCard(boton, true);
      console.log(`✅ Receta "${nombreReceta}" guardada desde la card`);
    } else {
      mostrarMensaje(resultado.mensaje || "No se pudo guardar la receta", "error");
      boton.disabled = false;
    }
  } catch (error) {
    console.error("Error al guardar receta:", error);
    mostrarMensaje("Error al guardar la receta", "error");
    boton.disabled = false;
  }
}

/**
 * Desguarda una receta desde el botón en la card
 * @param {string} nombreReceta - Nombre de la receta a desguardar
 * @param {HTMLElement} boton - Elemento del botón
 */
async function desguardarRecetaCard(nombreReceta, boton) {
  try {
    // Deshabilitar el botón mientras se procesa
    boton.disabled = true;
    
    const response = await fetch("/desguardar-receta", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ nombreReceta: nombreReceta }),
    });

    const resultado = await response.json();

    if (resultado.exito) {
      // Actualizar el estado del botón a "no guardada"
      actualizarEstadoBotonCard(boton, false);
      console.log(`🗑️ Receta "${nombreReceta}" desguardada desde la card`);
    } else {
      mostrarMensaje(resultado.mensaje || "No se pudo desguardar la receta", "error");
      boton.disabled = false;
    }
  } catch (error) {
    console.error("Error al desguardar receta:", error);
    mostrarMensaje("Error al desguardar la receta", "error");
    boton.disabled = false;
  }
}

/**
 * Actualiza el aspecto del botón en la card según el estado de guardado
 * @param {HTMLElement} boton - Elemento del botón
 * @param {boolean} estaGuardada - true si la receta está guardada
 */
function actualizarEstadoBotonCard(boton, estaGuardada) {
  if (estaGuardada) {
    // Estado: Ya guardada (bookmark lleno, amarillo/dorado)
    boton.innerHTML = '<i class="bi bi-bookmark-fill fs-5 text-warning"></i>';
    boton.className = 'btn btn-light btn-sm position-absolute top-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center btn-guardar-card shadow-sm';
    boton.setAttribute('data-guardada', 'true');
    boton.title = 'Quitar de guardados';
  } else {
    // Estado: No guardada (bookmark vacío)
    boton.innerHTML = '<i class="bi bi-bookmark fs-5"></i>';
    boton.className = 'btn btn-light btn-sm position-absolute top-0 end-0 m-2 rounded-circle d-flex align-items-center justify-content-center btn-guardar-card shadow-sm';
    boton.setAttribute('data-guardada', 'false');
    boton.title = 'Guardar receta';
  }
  boton.disabled = false;
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
      
      // Guardar recetas en variable global para filtrado
      todasLasRecetasComunidad = recetas;

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
        
        // Configurar botones de guardar en las cards
        await configurarBotonesGuardarCards();
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

// Variables globales para almacenar la receta actual
let recetaActualNombre = null;
let recetaActualId = null;

/**
 * Carga y muestra los comentarios de una receta
 * @param {string} recetaId - ID de la receta
 */
async function cargarComentarios(recetaId) {
  console.log('📖 Cargando comentarios para receta ID:', recetaId);
  try {
    const url = `/api/comentarios-receta/${recetaId}`;
    console.log('🌐 URL de comentarios:', url);
    
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    const resultado = await response.json();
    console.log('📦 Resultado completo de comentarios:', JSON.stringify(resultado, null, 2));
    
    if (resultado.exito) {
      // Los comentarios vienen directamente en resultado, no en resultado.data
      const comentarios = resultado.comentarios || [];
      console.log('💬 Comentarios encontrados:', comentarios.length, 'comentarios:', comentarios);
      mostrarComentarios(comentarios);
      
      // Actualizar contador
      const contadorElement = document.getElementById('contadorComentarios');
      if (contadorElement) {
        contadorElement.textContent = comentarios.length;
        console.log('✅ Contador actualizado a:', comentarios.length);
      } else {
        console.error('❌ No se encontró el elemento contadorComentarios');
      }
    } else {
      console.error("❌ Error al cargar comentarios:", resultado.mensaje);
    }
  } catch (error) {
    console.error("❌ Error al cargar comentarios:", error);
  }
}

/**
 * Muestra la lista de comentarios en el modal
 * @param {Array} comentarios - Array de comentarios
 */
function mostrarComentarios(comentarios) {
  const listaComentarios = document.getElementById('listaComentarios');
  console.log('🎨 Mostrando comentarios:', comentarios?.length || 0, 'elemento:', listaComentarios ? 'encontrado' : 'NO ENCONTRADO');
  
  if (!listaComentarios) {
    console.error('❌ No se encontró el elemento listaComentarios');
    return;
  }
  
  if (!comentarios || comentarios.length === 0) {
    listaComentarios.innerHTML = `
      <p class="text-muted text-center py-3">
        <i class="bi bi-chat-quote"></i>
        No hay comentarios aún. ¡Sé el primero en comentar!
      </p>
    `;
    return;
  }
  
  // Ordenar comentarios por fecha (más recientes primero)
  comentarios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  listaComentarios.innerHTML = comentarios.map(comentario => {
    const fecha = new Date(comentario.fecha);
    const fechaFormateada = formatearFechaComentario(fecha);
    
    return `
      <div class="card mb-3 border-0 bg-light">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0 text-primary">
              <i class="bi bi-person-circle me-1"></i>
              ${comentario.usuario || 'Usuario'}
            </h6>
            <small class="text-muted">
              <i class="bi bi-clock me-1"></i>
              ${fechaFormateada}
            </small>
          </div>
          <p class="mb-0">${escaparHTML(comentario.texto)}</p>
        </div>
      </div>
    `;
  }).join('');
  
  console.log('✅ Comentarios renderizados en el DOM');
}

/**
 * Formatea la fecha de un comentario de manera amigable
 * @param {Date} fecha - Fecha del comentario
 * @returns {string} Fecha formateada
 */
function formatearFechaComentario(fecha) {
  const ahora = new Date();
  const diferencia = ahora - fecha;
  
  const segundos = Math.floor(diferencia / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  
  if (segundos < 60) return 'Hace unos segundos';
  if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
  if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
  if (dias < 7) return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
  
  return fecha.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} texto - Texto a escapar
 * @returns {string} Texto escapado
 */
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

/**
 * Publica un nuevo comentario en la receta
 */
async function publicarComentario() {
  const textarea = document.getElementById('nuevoComentarioTexto');
  const texto = textarea.value.trim();
  
  if (!texto) {
    mostrarMensaje('Por favor, escribe un comentario antes de publicar.', 'warning');
    return;
  }
  
  if (!recetaActualNombre) {
    mostrarMensaje('Error: No se pudo identificar la receta.', 'error');
    return;
  }
  
  // Deshabilitar botón mientras se publica
  const btnPublicar = document.getElementById('publicarComentarioBtn');
  const textoOriginal = btnPublicar.innerHTML;
  btnPublicar.disabled = true;
  btnPublicar.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Publicando...';
  
  try {
    const response = await fetch('/api/comentar-receta', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        nombreReceta: recetaActualNombre,
        texto: texto
      })
    });
    
    const resultado = await response.json();
    
    if (resultado.exito) {
      console.log('✅ Comentario publicado exitosamente:', resultado);
      
      // Limpiar textarea
      textarea.value = '';
      document.getElementById('contadorCaracteres').textContent = '0';
      
      // Pequeño delay para asegurar que el backend guardó los datos
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Recargar comentarios usando el ID guardado
      console.log('🔄 Recargando comentarios. Nombre:', recetaActualNombre, 'ID:', recetaActualId);
      if (recetaActualId) {
        await cargarComentarios(recetaActualId);
        console.log('✅ Comentarios recargados');
      } else {
        console.error('❌ No hay recetaActualId disponible');
      }
      
      // Mostrar mensaje de éxito
      mostrarMensaje('✅ ¡Comentario publicado correctamente!', 'success');
    } else {
      mostrarMensaje(`Error al publicar comentario: ${resultado.mensaje || 'Error desconocido'}`, 'error');
    }
  } catch (error) {
    console.error('Error al publicar comentario:', error);
    mostrarMensaje('Error de conexión. No se pudo publicar el comentario.', 'error');
  } finally {
    // Restaurar botón
    btnPublicar.disabled = false;
    btnPublicar.innerHTML = textoOriginal;
  }
}

/**
 * Cancela el comentario y limpia el textarea
 */
function cancelarComentario() {
  const textarea = document.getElementById('nuevoComentarioTexto');
  textarea.value = '';
  document.getElementById('contadorCaracteres').textContent = '0';
}

/**
 * Actualiza el contador de caracteres del comentario
 */
function actualizarContadorCaracteres() {
  const textarea = document.getElementById('nuevoComentarioTexto');
  const contador = document.getElementById('contadorCaracteres');
  contador.textContent = textarea.value.length;
}

// ============================================
// FUNCIONES DE VALORACIÓN
// ============================================

/**
 * Carga las valoraciones de una receta
 * @param {string} recetaId - ID de la receta
 * @param {string} nombreReceta - Nombre de la receta
 */
async function cargarValoraciones(recetaId, nombreReceta) {
  console.log(`⭐ Cargando valoraciones para receta ID: ${recetaId}`);
  recetaActualNombre = nombreReceta;
  recetaActualId = recetaId;
  
  try {
    const respuesta = await fetch(`/api/valoracion-receta/${recetaId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const resultado = await respuesta.json();
    console.log('📊 Resultado de valoraciones:', resultado);
    
    if (resultado.exito) {
      mostrarValoraciones(resultado);
      configurarEstrellas(resultado.valoracionUsuario || 0);
    } else {
      console.error('❌ Error al cargar valoraciones:', resultado.mensaje);
    }
  } catch (error) {
    console.error('❌ Error al cargar valoraciones:', error);
  }
}

/**
 * Muestra las valoraciones en la interfaz
 * @param {Object} datos - Datos de las valoraciones
 */
function mostrarValoraciones(datos) {
  const { valoracionMedia, totalValoraciones } = datos;
  
  // Mostrar valoración media
  document.getElementById('valoracionMediaNumero').textContent = valoracionMedia.toFixed(1);
  
  // Mostrar estrellas de valoración media
  const contenedorEstrellas = document.getElementById('estrellaMediaReceta');
  contenedorEstrellas.innerHTML = '';
  
  for (let i = 1; i <= 5; i++) {
    const estrella = document.createElement('i');
    if (i <= Math.floor(valoracionMedia)) {
      estrella.className = 'bi bi-star-fill text-warning';
    } else if (i === Math.ceil(valoracionMedia) && valoracionMedia % 1 !== 0) {
      estrella.className = 'bi bi-star-half text-warning';
    } else {
      estrella.className = 'bi bi-star text-warning';
    }
    contenedorEstrellas.appendChild(estrella);
  }
  
  // Mostrar total de valoraciones
  const textoValoraciones = totalValoraciones === 0 
    ? 'Sin valoraciones' 
    : totalValoraciones === 1 
      ? '1 valoración' 
      : `${totalValoraciones} valoraciones`;
  document.getElementById('totalValoracionesTexto').textContent = textoValoraciones;
}

/**
 * Configura las estrellas interactivas para que el usuario valore
 * @param {number} valoracionActual - Valoración actual del usuario (0-5)
 */
function configurarEstrellas(valoracionActual) {
  const contenedor = document.getElementById('estrellaValoracionUsuario');
  const estrellas = document.querySelectorAll('.estrella-valoracion');
  
  // IMPORTANTE: Clonar el contenedor para eliminar todos los event listeners anteriores
  const nuevoContenedor = contenedor.cloneNode(true);
  contenedor.parentNode.replaceChild(nuevoContenedor, contenedor);
  
  // Obtener las nuevas estrellas del contenedor clonado
  const nuevasEstrellas = nuevoContenedor.querySelectorAll('.estrella-valoracion');
  
  // Marcar las estrellas según la valoración actual
  actualizarEstrellasVisuales(valoracionActual);
  
  // Añadir eventos hover y click a las NUEVAS estrellas
  nuevasEstrellas.forEach((estrella, index) => {
    const valor = index + 1;
    
    // Evento hover: mostrar preview
    estrella.addEventListener('mouseenter', () => {
      actualizarEstrellasVisuales(valor);
    });
    
    // Evento click: enviar valoración
    estrella.addEventListener('click', async () => {
      await enviarValoracion(valor);
    });
  });
  
  // Evento mouse leave del contenedor: volver a mostrar valoración actual
  nuevoContenedor.addEventListener('mouseleave', () => {
    actualizarEstrellasVisuales(valoracionActual);
  });
  
  // Actualizar mensaje
  if (valoracionActual > 0) {
    document.getElementById('mensajeValoracion').textContent = `Tu valoración: ${valoracionActual} estrella${valoracionActual === 1 ? '' : 's'}`;
  }
}

/**
 * Actualiza visualmente las estrellas
 * @param {number} valor - Número de estrellas a iluminar (0-5)
 */
function actualizarEstrellasVisuales(valor) {
  const estrellas = document.querySelectorAll('.estrella-valoracion');
  estrellas.forEach((estrella, index) => {
    if (index < valor) {
      estrella.className = 'bi bi-star-fill text-warning estrella-valoracion';
    } else {
      estrella.className = 'bi bi-star text-warning estrella-valoracion';
    }
  });
}

/**
 * Envía una valoración al servidor
 * @param {number} puntuacion - Puntuación de 1 a 5
 */
async function enviarValoracion(puntuacion) {
  console.log(`⭐ Enviando valoración: ${puntuacion} estrellas para "${recetaActualNombre}"`);
  
  try {
    const respuesta = await fetch('/api/valorar-receta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        nombreReceta: recetaActualNombre,
        puntuacion: puntuacion
      })
    });
    
    const resultado = await respuesta.json();
    console.log('✅ Resultado de valoración:', resultado);
    
    if (resultado.exito) {
      // Actualizar interfaz con nueva valoración media
      mostrarValoraciones({
        valoracionMedia: resultado.valoracionMedia,
        totalValoraciones: resultado.totalValoraciones
      });
      
      // Actualizar configuración de estrellas
      configurarEstrellas(puntuacion);
      
      // Mostrar mensaje de éxito
      mostrarMensaje('¡Valoración guardada!', "success");
      
    } else {
      mostrarMensaje('error', resultado.mensaje || 'Error al guardar la valoración');
    }
  } catch (error) {
    console.error('❌ Error al enviar valoración:', error);
    mostrarMensaje('error', 'Error de conexión al enviar la valoración');
  }
}

// ============================================
// FUNCIONES DE FILTRADO
// ============================================

/**
 * Filtra las recetas según los criterios proporcionados
 * @param {Array} recetas - Array de recetas a filtrar
 * @param {Object} filtros - Objeto con los filtros a aplicar
 * @returns {Array} - Recetas filtradas
 */
function filtrarRecetasComunidad(recetas, filtros) {
  return recetas.filter(receta => {
    // Filtro por ingredientes múltiples (búsqueda parcial, case-insensitive)
    if (filtros.ingredientes && filtros.ingredientes.length > 0) {
      const ingredientesReceta = (receta.ingredientes || '').toLowerCase();
      const todosPresentres = filtros.ingredientes.every(ing => 
        ingredientesReceta.includes(ing.toLowerCase())
      );
      if (!todosPresentres) return false;
    }

    // Filtro por alérgenos (excluir recetas que contengan alguno)
    if (filtros.alergenos && filtros.alergenos.length > 0) {
      const alergenosReceta = (receta.alergenos || '').toLowerCase().trim();
      // Solo verificar si la receta tiene alérgenos especificados
      if (alergenosReceta !== '') {
        // Verificar si alguno de los alérgenos del filtro está presente en la receta
        const contieneAlergeno = filtros.alergenos.some(alergeno => {
          const alergenoLower = alergeno.toLowerCase().trim();
          // Buscar el alérgeno como palabra completa o parte de una lista separada por comas
          return alergenosReceta.split(',').some(alergenoReceta => 
            alergenoReceta.trim().includes(alergenoLower)
          );
        });
        if (contieneAlergeno) return false; // Excluir esta receta
      }
      // Si la receta no tiene alérgenos especificados, no la excluimos (continuar)
    }

    // Filtro por país (coincidencia exacta)
    if (filtros.paisOrigen && receta.paisOrigen !== filtros.paisOrigen) {
      return false;
    }

    // Filtro por usuario (búsqueda parcial en email)
    if (filtros.usuario) {
      const usuarioFiltro = filtros.usuario.toLowerCase();
      const usuarioReceta = (receta.usuario || '').toLowerCase();
      if (!usuarioReceta.includes(usuarioFiltro)) return false;
    }

    // Filtro por dificultad (coincidencia exacta)
    if (filtros.dificultad && receta.dificultad !== filtros.dificultad) {
      return false;
    }

    // Filtro por turno de comida (coincidencia exacta)
    if (filtros.turnoComida && receta.turnoComida !== filtros.turnoComida) {
      return false;
    }

    // Filtro por duración (menor o igual que el valor especificado)
    if (filtros.duracion) {
      const duracionMaxima = parseInt(filtros.duracion);
      const duracionReceta = parseInt(receta.duracion || 0);
      if (duracionReceta > duracionMaxima) return false;
    }

    // Filtro por valoración mínima
    if (filtros.valoracion) {
      const valoracionMinima = parseFloat(filtros.valoracion);
      const valoracionReceta = receta.valoracionMedia || 0;
      
      // Solo considerar recetas con valoraciones
      if (valoracionReceta === 0 || valoracionReceta < valoracionMinima) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Obtiene los valores de los filtros del formulario
 * @returns {Object} - Objeto con los valores de los filtros
 */
function obtenerFiltrosDelFormulario() {
  const form = document.getElementById('filtrosRecetasForm');
  if (!form) return {};

  const formData = new FormData(form);
  const filtros = {};

  // Agregar ingredientes múltiples desde los tags
  if (ingredientesTagsComunidad.length > 0) {
    filtros.ingredientes = ingredientesTagsComunidad;
  }
  
  // Agregar alérgenos múltiples desde los tags
  if (alergenosTagsComunidad.length > 0) {
    filtros.alergenos = alergenosTagsComunidad;
  }

  for (let [key, value] of formData.entries()) {
    // Omitir ingredientes y alergenos porque ya los manejamos con tags
    if (key === 'ingredientes' || key === 'alergenos') continue;
    
    if (value && value.trim() !== '') {
      filtros[key] = value.trim();
    }
  }

  return filtros;
}

/**
 * Muestra las recetas filtradas en el contenedor
 */
function mostrarRecetasFiltradas() {
  const filtros = obtenerFiltrosDelFormulario();
  const recetasFiltradas = filtrarRecetasComunidad(todasLasRecetasComunidad, filtros);

  const contenedor = document.getElementById('contenedorRecetas');
  const totalRecetasElement = document.getElementById('totalRecetas');

  if (!contenedor) return;

  // Actualizar contador
  if (totalRecetasElement) {
    totalRecetasElement.textContent = recetasFiltradas.length;
  }

  // Limpiar contenedor
  contenedor.innerHTML = '';

  // Mostrar recetas filtradas
  if (recetasFiltradas.length === 0) {
    contenedor.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning text-center" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          No se encontraron recetas que coincidan con los filtros seleccionados.
        </div>
      </div>
    `;
  } else {
    // Generar HTML de las cards filtradas usando innerHTML (crearCardReceta ya incluye el wrapper column)
    contenedor.innerHTML = recetasFiltradas.map(receta => 
      crearCardReceta(receta, true)
    ).join('');

    // Agregar event listeners a las nuevas cards
    agregarEventListenersRecetas(abrirModalDetalleReceta);
    
    // Configurar botones de guardar en las cards filtradas
    configurarBotonesGuardarCards();
  }

  // Mostrar filtros activos
  mostrarFiltrosActivos(filtros);

  // Cerrar el modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('filtrosRecetasModal'));
  if (modal) modal.hide();
}

/**
 * Muestra los filtros activos como badges tanto en el modal como en la página
 * @param {Object} filtros - Objeto con los filtros activos
 */
function mostrarFiltrosActivos(filtros) {
  // Actualizar filtros en el modal
  const container = document.getElementById('filtrosActivosContainer');
  const listContainer = document.getElementById('filtrosActivosList');

  if (container && listContainer) {
    const filtrosArray = Object.entries(filtros);

    if (filtrosArray.length === 0) {
      container.style.display = 'none';
    } else {
      container.style.display = 'block';
      listContainer.innerHTML = '';

      const nombresAmigables = {
        ingredientes: 'Ingredientes',
        paisOrigen: 'País',
        usuario: 'Usuario',
        dificultad: 'Dificultad',
        turnoComida: 'Turno de Comida',
        duracion: 'Duración',
        valoracion: 'Valoración'
      };

      filtrosArray.forEach(([key, value]) => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary me-2 mb-2';
        badge.style.fontSize = '0.9rem';
        badge.style.cursor = 'pointer';
        
        let valorMostrar = value;
        if (key === 'duracion') {
          valorMostrar = `≤ ${value} min`;
        } else if (key === 'valoracion') {
          valorMostrar = `≥ ${value} ⭐`;
        }
        
        badge.innerHTML = `
          <strong>${nombresAmigables[key] || key}:</strong> ${valorMostrar}
          <i class="bi bi-x-circle ms-1" onclick="eliminarFiltro('${key}')" style="cursor: pointer;"></i>
        `;
        
        listContainer.appendChild(badge);
      });
    }
  }
  
  // Actualizar filtros en la página principal
  mostrarFiltrosActivosEnPagina(filtros);
}

/**
 * Muestra los filtros activos en la página principal (fuera del modal)
 * @param {Object} filtros - Objeto con los filtros activos
 */
function mostrarFiltrosActivosEnPagina(filtros) {
  const pageContainer = document.getElementById('filtrosActivosPageContainer');
  const pageList = document.getElementById('filtrosActivosPageList');

  if (!pageContainer || !pageList) return;

  const filtrosArray = Object.entries(filtros);

  if (filtrosArray.length === 0) {
    pageContainer.style.display = 'none';
    return;
  }

  pageContainer.style.display = 'block';
  pageList.innerHTML = '';

  const nombresAmigables = {
    paisOrigen: 'País',
    usuario: 'Usuario',
    dificultad: 'Dificultad',
    turnoComida: 'Turno de Comida',
    duracion: 'Duración',
    valoracion: 'Valoración'
  };

  filtrosArray.forEach(([key, value]) => {
    // Manejar ingredientes múltiples
    if (key === 'ingredientes' && Array.isArray(value)) {
      value.forEach(ing => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-success me-2 mb-2';
        badge.style.fontSize = '0.95rem';
        badge.style.cursor = 'pointer';
        badge.innerHTML = `
          <strong>Ingrediente:</strong> ${ing}
          <i class="bi bi-x-circle ms-1" onclick="eliminarFiltroYAplicar('ingrediente', '${ing}')" style="cursor: pointer;" title="Eliminar filtro"></i>
        `;
        pageList.appendChild(badge);
      });
      return;
    }
    
    // Manejar alérgenos múltiples
    if (key === 'alergenos' && Array.isArray(value)) {
      value.forEach(alg => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-danger me-2 mb-2';
        badge.style.fontSize = '0.95rem';
        badge.style.cursor = 'pointer';
        badge.innerHTML = `
          <strong>Excluir alérgeno:</strong> ${alg}
          <i class="bi bi-x-circle ms-1" onclick="eliminarFiltroYAplicar('alergeno', '${alg}')" style="cursor: pointer;" title="Eliminar filtro"></i>
        `;
        pageList.appendChild(badge);
      });
      return;
    }
    
    const badge = document.createElement('span');
    badge.className = 'badge bg-primary me-2 mb-2';
    badge.style.fontSize = '0.95rem';
    badge.style.cursor = 'pointer';
    
    let valorMostrar = value;
    if (key === 'duracion') {
      valorMostrar = `≤ ${value} min`;
    } else if (key === 'valoracion') {
      valorMostrar = `≥ ${value} ⭐`;
    }
    
    badge.innerHTML = `
      <strong>${nombresAmigables[key] || key}:</strong> ${valorMostrar}
      <i class="bi bi-x-circle ms-1" onclick="eliminarFiltroYAplicar('${key}')" style="cursor: pointer;" title="Eliminar filtro"></i>
    `;
    
    pageList.appendChild(badge);
  });
}

/**
 * Actualiza solo la visualización de filtros activos dentro del modal
 * @param {Object} filtros - Objeto con los filtros activos
 */
function mostrarFiltrosActivosEnModal(filtros) {
  const container = document.getElementById('filtrosActivosContainer');
  const listContainer = document.getElementById('filtrosActivosList');

  if (!container || !listContainer) return;

  const filtrosArray = Object.entries(filtros);

  if (filtrosArray.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  listContainer.innerHTML = '';

  const nombresAmigables = {
    paisOrigen: 'País',
    usuario: 'Usuario',
    dificultad: 'Dificultad',
    turnoComida: 'Turno de Comida',
    duracion: 'Duración',
    valoracion: 'Valoración'
  };

  filtrosArray.forEach(([key, value]) => {
    // Manejar ingredientes múltiples
    if (key === 'ingredientes' && Array.isArray(value)) {
      value.forEach(ing => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-success me-2 mb-2';
        badge.style.fontSize = '0.9rem';
        badge.style.cursor = 'pointer';
        badge.innerHTML = `
          <strong>Ingrediente:</strong> ${ing}
          <i class="bi bi-x-circle ms-1" onclick="eliminarFiltro('ingrediente', '${ing}')" style="cursor: pointer;"></i>
        `;
        listContainer.appendChild(badge);
      });
      return;
    }
    
    // Manejar alérgenos múltiples
    if (key === 'alergenos' && Array.isArray(value)) {
      value.forEach(alg => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-danger me-2 mb-2';
        badge.style.fontSize = '0.9rem';
        badge.style.cursor = 'pointer';
        badge.innerHTML = `
          <strong>Excluir alérgeno:</strong> ${alg}
          <i class="bi bi-x-circle ms-1" onclick="eliminarFiltro('alergeno', '${alg}')" style="cursor: pointer;"></i>
        `;
        listContainer.appendChild(badge);
      });
      return;
    }
    
    const badge = document.createElement('span');
    badge.className = 'badge bg-primary me-2 mb-2';
    badge.style.fontSize = '0.9rem';
    badge.style.cursor = 'pointer';
    
    let valorMostrar = value;
    if (key === 'duracion') {
      valorMostrar = `≤ ${value} min`;
    } else if (key === 'valoracion') {
      valorMostrar = `≥ ${value} ⭐`;
    }
    
    badge.innerHTML = `
      <strong>${nombresAmigables[key] || key}:</strong> ${valorMostrar}
      <i class="bi bi-x-circle ms-1" onclick="eliminarFiltro('${key}')" style="cursor: pointer;"></i>
    `;
    
    listContainer.appendChild(badge);
  });
}

/**
 * Elimina un filtro específico del formulario sin aplicar los cambios
 * @param {string} nombreFiltro - Nombre del campo del filtro a eliminar
 * @param {string} valor - Valor específico (para ingredientes/alérgenos múltiples)
 */
window.eliminarFiltro = function(nombreFiltro, valor = null) {
  // Si es ingrediente o alérgeno, eliminar del array de tags
  if (nombreFiltro === 'ingrediente') {
    eliminarTag('ingrediente', valor);
    const filtros = obtenerFiltrosDelFormulario();
    mostrarFiltrosActivosEnModal(filtros);
    return;
  }
  
  if (nombreFiltro === 'alergeno') {
    eliminarTag('alergeno', valor);
    const filtros = obtenerFiltrosDelFormulario();
    mostrarFiltrosActivosEnModal(filtros);
    return;
  }
  
  const form = document.getElementById('filtrosRecetasForm');
  if (!form) return;

  const campo = form.elements[nombreFiltro];
  if (campo) {
    if (campo.tagName === 'SELECT') {
      campo.selectedIndex = 0; // Volver a la primera opción (vacía)
    } else {
      campo.value = '';
    }
  }

  // Actualizar la vista de filtros activos en el modal sin aplicar los filtros
  const filtros = obtenerFiltrosDelFormulario();
  mostrarFiltrosActivosEnModal(filtros);
};

/**
 * Limpia todos los filtros y actualiza la visualización en el modal
 */
function limpiarFiltros() {
  const form = document.getElementById('filtrosRecetasForm');
  if (form) {
    form.reset();
  }
  
  // Limpiar arrays de tags
  ingredientesTagsComunidad = [];
  alergenosTagsComunidad = [];
  actualizarTagsUI('ingredientes');
  actualizarTagsUI('alergenos');

  // Limpiar la visualización de filtros activos en el modal
  const container = document.getElementById('filtrosActivosContainer');
  if (container) {
    container.style.display = 'none';
  }
}

/**
 * Elimina un filtro desde la página principal y aplica los cambios inmediatamente
 * @param {string} nombreFiltro - Nombre del campo del filtro a eliminar
 * @param {string} valor - Valor específico (para ingredientes/alérgenos múltiples)
 */
window.eliminarFiltroYAplicar = function(nombreFiltro, valor = null) {
  // Si es ingrediente o alérgeno, eliminar del array de tags
  if (nombreFiltro === 'ingrediente') {
    eliminarTag('ingrediente', valor);
  } else if (nombreFiltro === 'alergeno') {
    eliminarTag('alergeno', valor);
  } else {
    const form = document.getElementById('filtrosRecetasForm');
    if (!form) return;

    const campo = form.elements[nombreFiltro];
    if (campo) {
      if (campo.tagName === 'SELECT') {
        campo.selectedIndex = 0;
      } else {
        campo.value = '';
      }
    }
  }

  // Aplicar los filtros inmediatamente
  mostrarRecetasFiltradas();
};

/**
 * Limpia todos los filtros desde la página principal y muestra todas las recetas
 */
window.limpiarTodosFiltros = function() {
  const form = document.getElementById('filtrosRecetasForm');
  if (form) {
    form.reset();
  }
  
  // Limpiar arrays de tags
  ingredientesTagsComunidad = [];
  alergenosTagsComunidad = [];
  actualizarTagsUI('ingredientes');
  actualizarTagsUI('alergenos');

  // Ocultar contenedores de filtros activos
  const container = document.getElementById('filtrosActivosContainer');
  if (container) {
    container.style.display = 'none';
  }
  
  const pageContainer = document.getElementById('filtrosActivosPageContainer');
  if (pageContainer) {
    pageContainer.style.display = 'none';
  }

  // Mostrar todas las recetas
  const contenedor = document.getElementById('contenedorRecetas');
  const totalRecetasElement = document.getElementById('totalRecetas');

  if (!contenedor) return;

  if (totalRecetasElement) {
    totalRecetasElement.textContent = todasLasRecetasComunidad.length;
  }

  contenedor.innerHTML = '';

  if (todasLasRecetasComunidad.length === 0) {
    contenedor.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning text-center" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          No hay recetas disponibles.
        </div>
      </div>
    `;
  } else {
    contenedor.innerHTML = todasLasRecetasComunidad.map(receta => 
      crearCardReceta(receta, true)
    ).join('');

    agregarEventListenersRecetas(abrirModalDetalleReceta);
    configurarBotonesGuardarCards();
  }
};

// ============================================
// EVENT LISTENERS PARA FILTROS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Cargar recetas al iniciar
  cargarRecetasComunidad();
  
  // 2. Event listeners de filtros
  const aplicarFiltrosBtn = document.getElementById('aplicarFiltrosBtn');
  if (aplicarFiltrosBtn) {
    aplicarFiltrosBtn.addEventListener('click', mostrarRecetasFiltradas);
  }

  const limpiarFiltrosBtn = document.getElementById('limpiarFiltrosBtn');
  if (limpiarFiltrosBtn) {
    limpiarFiltrosBtn.addEventListener('click', limpiarFiltros);
  }
  
  // Event listeners para campos de ingredientes y alérgenos
  const inputIngredientes = document.getElementById('filtroIngredientes');
  const inputAlergenos = document.getElementById('filtroAlergenos');
  
  if (inputIngredientes) {
    inputIngredientes.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const valor = this.value.trim();
        if (valor) {
          agregarTag('ingrediente', valor);
          this.value = '';
        }
      }
    });
  }
  
  if (inputAlergenos) {
    inputAlergenos.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const valor = this.value.trim();
        if (valor) {
          agregarTag('alergeno', valor);
          this.value = '';
        }
      }
    });
  }
  
  // Event listener para cuando se abre el modal de filtros
  const modalFiltros = document.getElementById('filtrosRecetasModal');
  if (modalFiltros) {
    modalFiltros.addEventListener('show.bs.modal', function() {
      // Actualizar la visualización de filtros activos al abrir el modal
      const filtros = obtenerFiltrosDelFormulario();
      mostrarFiltrosActivosEnModal(filtros);
    });
  }
  
  // 3. Event listeners de comentarios
  const textarea = document.getElementById('nuevoComentarioTexto');
  if (textarea) {
    textarea.addEventListener('input', actualizarContadorCaracteres);
  }
  
  const btnPublicar = document.getElementById('publicarComentarioBtn');
  if (btnPublicar) {
    btnPublicar.addEventListener('click', publicarComentario);
  }
  
  const btnCancelar = document.getElementById('cancelarComentarioBtn');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', cancelarComentario);
  }
});

