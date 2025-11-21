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
  
  // Cargar comentarios
  if (receta.id) {
    cargarComentarios(receta.id);
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
              ${comentario.nombreUsuario || 'Usuario'}
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

// Cargar recetas al cargar la página
document.addEventListener("DOMContentLoaded", cargarRecetasComunidad);

// Inicializar eventos de comentarios cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
  // Contador de caracteres
  const textarea = document.getElementById('nuevoComentarioTexto');
  if (textarea) {
    textarea.addEventListener('input', actualizarContadorCaracteres);
  }
  
  // Botón publicar comentario
  const btnPublicar = document.getElementById('publicarComentarioBtn');
  if (btnPublicar) {
    btnPublicar.addEventListener('click', publicarComentario);
  }
  
  // Botón cancelar comentario
  const btnCancelar = document.getElementById('cancelarComentarioBtn');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', cancelarComentario);
  }
});
