/**
 * Módulo para gestionar el menú semanal
 */

// Importar sistema de mensajes
import { mostrarMensaje } from './components/message-handler.js';

// Elementos del DOM
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const menuSemanalContainer = document.getElementById('menuSemanal');
const btnCrearAutomatico = document.getElementById('btnCrearAutomatico');
const btnCrearManual = document.getElementById('btnCrearManual');
const btnEditarMenu = document.getElementById('btnEditarMenu');
const btnEliminarMenu = document.getElementById('btnEliminarMenu');

// Configuración de días y comidas
const DIAS_SEMANA = [
  { id: 'lunes', nombre: 'Lunes' },
  { id: 'martes', nombre: 'Martes' },
  { id: 'miercoles', nombre: 'Miércoles' },
  { id: 'jueves', nombre: 'Jueves' },
  { id: 'viernes', nombre: 'Viernes' },
  { id: 'sabado', nombre: 'Sábado' },
  { id: 'domingo', nombre: 'Domingo' }
];

const COMIDAS = [
  { id: 'desayuno', nombre: 'Desayuno', icon: 'bi-cup-hot' },
  { id: 'aperitivo', nombre: 'Aperitivo', icon: 'bi-cup-straw' },
  { id: 'comida', nombre: 'Comida', icon: 'bi-egg-fried' },
  { id: 'merienda', nombre: 'Merienda', icon: 'bi-cookie' },
  { id: 'cena', nombre: 'Cena', icon: 'bi-moon-stars' }
];

/**
 * Inicializa la página del menú semanal
 */
async function inicializarMenuSemanal() {
  try {
    await cargarMenuSemanal();
    configurarEventos();
  } catch (error) {
    console.error('Error al inicializar menú semanal:', error);
    mostrarError();
  }
}

/**
 * Configura los eventos de los botones
 */
function configurarEventos() {
  if (btnCrearAutomatico) {
    btnCrearAutomatico.addEventListener('click', crearMenuAutomatico);
  }
  
  if (btnCrearManual) {
    btnCrearManual.addEventListener('click', crearMenuManual);
  }
  
  if (btnEditarMenu) {
    btnEditarMenu.addEventListener('click', editarMenuSemanal);
  }
  
  if (btnEliminarMenu) {
    btnEliminarMenu.addEventListener('click', eliminarMenuSemanal);
  }
}

/**
 * Carga el menú semanal del usuario
 */
async function cargarMenuSemanal() {
  try {
    mostrarEstado('loading');
    
    const response = await fetch('/api/menu-semanal', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar el menú semanal');
    }
    
    const data = await response.json();
    
    if (data.menuSemanal) {
      // Hay menú semanal, mostrarlo
      renderizarMenuSemanal(data.menuSemanal);
      mostrarEstado('menu');
    } else {
      // No hay menú semanal, mostrar estado vacío
      mostrarEstado('empty');
    }
    
  } catch (error) {
    console.error('Error al cargar menú semanal:', error);
    mostrarError();
  }
}

/**
 * Crea un menú semanal automático
 */
async function crearMenuAutomatico() {
  try {
    btnCrearAutomatico.disabled = true;
    btnCrearAutomatico.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creando...';
    
    console.log('Enviando petición para crear menú automático...');
    
    const response = await fetch('/api/menu-semanal/crear-automatico', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Respuesta recibida:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ mensaje: 'Error desconocido' }));
      console.error('Error en la respuesta:', errorData);
      throw new Error(errorData.mensaje || 'Error al crear menú automático');
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', data);
    
    if (data.exito && data.menuSemanal) {
      // Mostrar menú en modo editable para que el usuario pueda confirmar o cancelar
      renderizarMenuManualEditable(data.menuSemanal, true); // true = es menú automático generado
      mostrarEstado('menu', false); // false = no mostrar botón de eliminar durante creación
      mostrarMensaje('Menú automático generado. Revísalo y confirma para guardarlo', 'info');
    } else {
      console.error('Respuesta inesperada:', data);
      throw new Error(data.mensaje || 'Error al crear menú automático');
    }
    
  } catch (error) {
    console.error('Error al crear menú automático:', error);
    mostrarMensaje('Error al crear el menú automático: ' + error.message, 'error');
  } finally {
    btnCrearAutomatico.disabled = false;
    btnCrearAutomatico.innerHTML = '<i class="bi bi-magic"></i> Crear Menú Automático';
  }
}

/**
 * Crea un menú semanal manual (vacío)
 */
async function crearMenuManual() {
  try {
    btnCrearManual.disabled = true;
    btnCrearManual.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creando...';
    
    // Crear menú vacío directamente en el cliente
    const menuVacio = {
      lunes: { desayuno: null, aperitivo: null, comida: null, merienda: null, cena: null },
      martes: { desayuno: null, aperitivo: null, comida: null, merienda: null, cena: null },
      miercoles: { desayuno: null, aperitivo: null, comida: null, merienda: null, cena: null },
      jueves: { desayuno: null, aperitivo: null, comida: null, merienda: null, cena: null },
      viernes: { desayuno: null, aperitivo: null, comida: null, merienda: null, cena: null },
      sabado: { desayuno: null, aperitivo: null, comida: null, merienda: null, cena: null },
      domingo: { desayuno: null, aperitivo: null, comida: null, merienda: null, cena: null }
    };
    
    // Renderizar menú en modo edición
    renderizarMenuManualEditable(menuVacio);
    mostrarEstado('menu', false); // false = no mostrar botón de eliminar
    
  } catch (error) {
    console.error('Error al crear menú manual:', error);
    mostrarMensaje('Error al crear el menú manual: ' + error.message, 'error');
  } finally {
    btnCrearManual.disabled = false;
    btnCrearManual.innerHTML = '<i class="bi bi-pencil-square"></i> Crear Menú Manual';
  }
}

/**
 * Edita el menú semanal existente
 */
async function editarMenuSemanal() {
  try {
    btnEditarMenu.disabled = true;
    btnEditarMenu.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Cargando...';
    
    // Obtener el menú semanal actual
    const response = await fetch('/api/menu-semanal', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar el menú semanal');
    }
    
    const data = await response.json();
    
    if (data.menuSemanal) {
      // Renderizar menú en modo edición
      renderizarMenuManualEditable(data.menuSemanal);
      mostrarEstado('menu', false); // false = no mostrar botones de acción
    } else {
      throw new Error('No se encontró el menú semanal');
    }
    
  } catch (error) {
    console.error('Error al editar menú:', error);
    mostrarMensaje('Error al cargar el menú para edición: ' + error.message, 'error');
  } finally {
    btnEditarMenu.disabled = false;
    btnEditarMenu.innerHTML = '<i class="bi bi-pencil"></i> Editar Menú';
  }
}

/**
 * Renderiza el menú semanal en el DOM
 */
function renderizarMenuSemanal(menuSemanal) {
  menuSemanalContainer.innerHTML = '';
  
  DIAS_SEMANA.forEach(dia => {
    const diaData = menuSemanal[dia.id];
    const diaCard = crearTarjetaDia(dia, diaData);
    menuSemanalContainer.appendChild(diaCard);
  });
}

/**
 * Crea la tarjeta HTML para un día
 */
function crearTarjetaDia(dia, diaData) {
  const col = document.createElement('div');
  col.className = 'col-12';
  
  const card = document.createElement('div');
  card.className = 'card shadow-sm';
  
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header bg-primary text-white';
  cardHeader.innerHTML = `<h5 class="mb-0"><i class="bi bi-calendar-day me-2"></i>${dia.nombre}</h5>`;
  
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  
  const row = document.createElement('div');
  row.className = 'row g-3';
  
  COMIDAS.forEach(comida => {
    const comidaCol = document.createElement('div');
    comidaCol.className = 'col-12 col-md-6 col-lg';
    
    const comidaCard = crearTarjetaComida(comida, diaData ? diaData[comida.id] : null);
    comidaCol.appendChild(comidaCard);
    row.appendChild(comidaCol);
  });
  
  cardBody.appendChild(row);
  card.appendChild(cardHeader);
  card.appendChild(cardBody);
  col.appendChild(card);
  
  return col;
}

/**
 * Crea la tarjeta HTML para una comida
 */
function crearTarjetaComida(comida, receta) {
  const card = document.createElement('div');
  card.className = 'card h-100 border-secondary';
  
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body text-center d-flex flex-column';
  
  const titulo = document.createElement('h6');
  titulo.className = 'card-title mb-3';
  titulo.textContent = comida.nombre;
  
  const contenido = document.createElement('div');
  contenido.className = 'flex-grow-1 d-flex flex-column align-items-center justify-content-center';
  
  if (receta && receta !== null) {
    // Hay una receta asignada
    const nombreReceta = typeof receta === 'object' ? receta.nombreReceta : receta;
    const fotoReceta = typeof receta === 'object' ? receta.fotoReceta : '';
    
    // Hacer el contenido clickeable
    contenido.style.cursor = 'pointer';
    contenido.title = 'Click para ver detalles de la receta';
    contenido.addEventListener('click', () => {
      abrirModalInfoReceta(nombreReceta);
    });
    
    if (fotoReceta) {
      // Mostrar foto de la receta
      contenido.innerHTML = `
        <img src="${fotoReceta}" alt="${nombreReceta}" 
             class="rounded mb-2" style="width: 100%; max-width: 150px; height: 100px; object-fit: cover;">
        <small class="text-muted">${nombreReceta}</small>
      `;
    } else {
      // Mostrar icono por defecto según el turno (mantener color naranja)
      contenido.innerHTML = `
        <i class="bi ${comida.icon} text-primary mb-2" style="font-size: 4rem;"></i>
        <small class="text-muted">${nombreReceta}</small>
      `;
    }
  } else {
    // No hay receta asignada
    contenido.className += ' text-warning';
    contenido.innerHTML = `
      <i class="bi ${comida.icon} text-warning mb-2" style="font-size: 4rem; opacity: 0.3;"></i>
      <small class="fst-italic">No hay recetas para este turno</small>
    `;
  }
  
  cardBody.appendChild(titulo);
  cardBody.appendChild(contenido);
  card.appendChild(cardBody);
  
  return card;
}

/**
 * Muestra el estado correspondiente (loading, empty, menu)
 */
function mostrarEstado(estado, mostrarBotonesAccion = true) {
  loadingState.style.display = 'none';
  emptyState.style.display = 'none';
  menuSemanalContainer.style.display = 'none';
  btnEditarMenu.style.display = 'none';
  btnEliminarMenu.style.display = 'none';
  
  switch (estado) {
    case 'loading':
      loadingState.style.display = 'block';
      break;
    case 'empty':
      emptyState.style.display = 'block';
      break;
    case 'menu':
      menuSemanalContainer.style.display = 'block';
      if (mostrarBotonesAccion) {
        btnEditarMenu.style.display = 'inline-block';
        btnEliminarMenu.style.display = 'inline-block';
      }
      break;
  }
}

/**
 * Muestra un mensaje de error
 */
function mostrarError() {
  loadingState.style.display = 'none';
  emptyState.style.display = 'block';
  emptyState.querySelector('.card-body').innerHTML = `
    <i class="bi bi-exclamation-triangle text-danger" style="font-size: 4rem;"></i>
    <h3 class="mt-4 mb-3">Error al cargar el menú</h3>
    <p class="text-muted mb-4">
      Ha ocurrido un error al cargar tu menú semanal. Por favor, recarga la página.
    </p>
    <button class="btn btn-primary" onclick="location.reload()">
      <i class="bi bi-arrow-clockwise"></i> Recargar página
    </button>
  `;
}

/**
 * Elimina el menú semanal actual
 */
async function eliminarMenuSemanal() {
  // Mostrar modal de confirmación
  const modal = new bootstrap.Modal(document.getElementById('eliminarMenuModal'));
  modal.show();
  
  // Configurar el botón de confirmar
  const btnConfirmar = document.getElementById('btnConfirmarEliminar');
  
  // Remover listeners previos para evitar duplicados
  const nuevoBtn = btnConfirmar.cloneNode(true);
  btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);
  
  // Añadir nuevo listener
  nuevoBtn.addEventListener('click', async () => {
    try {
      nuevoBtn.disabled = true;
      nuevoBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Eliminando...';
      
      const response = await fetch('/api/menu-semanal', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ mensaje: 'Error desconocido' }));
        throw new Error(errorData.mensaje || 'Error al eliminar menú');
      }
      
      const data = await response.json();
      
      if (data.exito) {
        // Cerrar modal
        modal.hide();
        
        // Actualizar vista
        mostrarEstado('empty');
        mostrarMensaje('Menú semanal eliminado correctamente', 'success');
      } else {
        throw new Error(data.mensaje || 'Error al eliminar menú');
      }
      
    } catch (error) {
      console.error('Error al eliminar menú:', error);
      modal.hide();
      mostrarMensaje('Error al eliminar el menú: ' + error.message, 'error');
    } finally {
      nuevoBtn.disabled = false;
      nuevoBtn.innerHTML = 'Eliminar Menú';
    }
  });
}

/**
 * Renderiza el menú semanal en modo edición manual
 */
function renderizarMenuManualEditable(menuSemanal) {
  menuSemanalContainer.innerHTML = '';
  
  // Guardar referencia al menú para usar en las funciones de edición
  window.menuSemanalTemporal = menuSemanal;
  
  // Ocultar los botones de editar y eliminar menú mientras se está editando
  if (btnEditarMenu) {
    btnEditarMenu.style.display = 'none';
  }
  if (btnEliminarMenu) {
    btnEliminarMenu.style.display = 'none';
  }
  
  // Crear botones de acción del menú
  const botonesAccion = document.createElement('div');
  botonesAccion.className = 'row mb-3';
  botonesAccion.innerHTML = `
    <div class="col-12 d-flex justify-content-end gap-2">
      <button id="btnCancelarMenuManual" class="btn btn-secondary">
        <i class="bi bi-x-circle"></i> Cancelar
      </button>
      <button id="btnGuardarMenuManual" class="btn btn-success">
        <i class="bi bi-check-circle"></i> Guardar Menú
      </button>
    </div>
  `;
  menuSemanalContainer.appendChild(botonesAccion);
  
  // Renderizar los días
  DIAS_SEMANA.forEach(dia => {
    const diaData = menuSemanal[dia.id];
    const diaCard = crearTarjetaDiaEditable(dia, diaData, menuSemanal);
    menuSemanalContainer.appendChild(diaCard);
  });
  
  // Configurar eventos de los botones de acción
  document.getElementById('btnCancelarMenuManual').addEventListener('click', () => {
    cargarMenuSemanal();
  });
  
  document.getElementById('btnGuardarMenuManual').addEventListener('click', () => {
    guardarMenuManual(menuSemanal);
  });
}

/**
 * Crea la tarjeta HTML para un día en modo edición
 */
function crearTarjetaDiaEditable(dia, diaData, menuSemanal) {
  const col = document.createElement('div');
  col.className = 'col-12';
  
  const card = document.createElement('div');
  card.className = 'card shadow-sm';
  
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header bg-primary text-white';
  cardHeader.innerHTML = `<h5 class="mb-0"><i class="bi bi-calendar-day me-2"></i>${dia.nombre}</h5>`;
  
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  
  const row = document.createElement('div');
  row.className = 'row g-3';
  
  COMIDAS.forEach(comida => {
    const comidaCol = document.createElement('div');
    comidaCol.className = 'col-12 col-md-6 col-lg';
    
    const comidaCard = crearTarjetaComidaEditable(comida, diaData ? diaData[comida.id] : null, dia.id, menuSemanal);
    comidaCol.appendChild(comidaCard);
    row.appendChild(comidaCol);
  });
  
  cardBody.appendChild(row);
  card.appendChild(cardHeader);
  card.appendChild(cardBody);
  col.appendChild(card);
  
  return col;
}

/**
 * Crea la tarjeta HTML para una comida en modo edición
 */
function crearTarjetaComidaEditable(comida, receta, diaId, menuSemanal) {
  const card = document.createElement('div');
  card.className = 'card h-100 border-secondary';
  
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body text-center d-flex flex-column';
  
  const titulo = document.createElement('h6');
  titulo.className = 'card-title mb-3';
  titulo.textContent = comida.nombre;
  
  const contenido = document.createElement('div');
  contenido.id = `receta-${diaId}-${comida.id}`;
  contenido.className = 'flex-grow-1 d-flex flex-column align-items-center justify-content-center mb-2';
  
  if (receta && receta !== null) {
    const nombreReceta = typeof receta === 'object' ? receta.nombreReceta : receta;
    const fotoReceta = typeof receta === 'object' ? receta.fotoReceta : '';
    
    if (fotoReceta) {
      contenido.innerHTML = `
        <div class="position-relative mb-2">
          <img src="${fotoReceta}" alt="${nombreReceta}" 
               class="rounded" style="width: 100%; max-width: 150px; height: 100px; object-fit: cover;">
          <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" 
                  onclick="eliminarRecetaDelMenu('${diaId}', '${comida.id}')" 
                  style="padding: 0.25rem 0.5rem;">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <small class="text-muted">${nombreReceta}</small>
      `;
    } else {
      contenido.innerHTML = `
        <div class="position-relative mb-2">
          <i class="bi ${comida.icon} text-primary" style="font-size: 4rem;"></i>
          <button class="btn btn-sm btn-danger position-absolute top-0 end-0" 
                  onclick="eliminarRecetaDelMenu('${diaId}', '${comida.id}')" 
                  style="padding: 0.25rem 0.5rem;">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <small class="text-muted">${nombreReceta}</small>
      `;
    }
  } else {
    contenido.innerHTML = `
      <i class="bi ${comida.icon} text-secondary mb-2" style="font-size: 4rem; opacity: 0.3;"></i>
      <small class="text-muted fst-italic">Vacío</small>
    `;
  }
  
  const btnAnadir = document.createElement('button');
  btnAnadir.className = 'btn btn-sm btn-outline-primary w-100 mt-auto';
  btnAnadir.innerHTML = '<i class="bi bi-plus-circle me-1"></i>Añadir receta';
  btnAnadir.addEventListener('click', () => {
    mostrarModalSeleccionReceta(comida.id, diaId, menuSemanal);
  });
  
  cardBody.appendChild(titulo);
  cardBody.appendChild(contenido);
  cardBody.appendChild(btnAnadir);
  card.appendChild(cardBody);
  
  return card;
}

/**
 * Muestra el modal para seleccionar una receta
 */
async function mostrarModalSeleccionReceta(turnoComida, diaId, menuSemanal) {
  try {
    // Obtener las recetas del usuario (propias y guardadas)
    const response = await fetch('/api/recetas/usuario', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar las recetas');
    }
    
    const data = await response.json();
    const todasRecetas = [...(data.recetasPropias || []), ...(data.recetasGuardadas || [])];
    
    // Filtrar recetas por turno de comida
    const recetasFiltradas = todasRecetas.filter(receta => 
      receta.turnoComida && receta.turnoComida.toLowerCase() === turnoComida.toLowerCase()
    );
    
    if (recetasFiltradas.length === 0) {
      mostrarMensaje(`No tienes recetas para el turno de ${turnoComida}`, 'warning');
      return;
    }
    
    // Crear o actualizar el modal
    let modal = document.getElementById('modalSeleccionReceta');
    if (!modal) {
      modal = crearModalSeleccionReceta();
      document.body.appendChild(modal);
    }
    
    // Actualizar contenido del modal
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `
      <div class="list-group">
        ${recetasFiltradas.map(receta => {
          const nombreEscapado = (receta.nombreReceta || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
          const fotoEscapada = (receta.fotoReceta || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
          
          return `
            <button type="button" class="list-group-item list-group-item-action" 
                    onclick="seleccionarReceta('${diaId}', '${turnoComida}', '${nombreEscapado}', '${fotoEscapada}')">
              <div class="d-flex align-items-center">
                ${receta.fotoReceta ? 
                  `<img src="${receta.fotoReceta}" alt="${receta.nombreReceta}" 
                       class="rounded me-3" style="width: 60px; height: 60px; object-fit: cover;">` : 
                  `<div class="bg-secondary rounded me-3 d-flex align-items-center justify-content-center" 
                       style="width: 60px; height: 60px;">
                     <i class="bi bi-image text-white"></i>
                   </div>`
                }
                <div>
                  <h6 class="mb-0">${receta.nombreReceta}</h6>
                  <small class="text-muted">${receta.dificultad || 'Sin especificar'} - ${receta.duracion || '?'} min</small>
                </div>
              </div>
            </button>
          `;
        }).join('')}
      </div>
    `;
    
    // Mostrar el modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Guardar referencia al menú para usar en seleccionarReceta
    window.menuSemanalTemporal = menuSemanal;
    
  } catch (error) {
    console.error('Error al cargar recetas:', error);
    mostrarMensaje('Error al cargar las recetas', 'error');
  }
}

/**
 * Crea el modal de selección de recetas
 */
function crearModalSeleccionReceta() {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'modalSeleccionReceta';
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Seleccionar Receta</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <!-- Se llenará dinámicamente -->
        </div>
      </div>
    </div>
  `;
  return modal;
}

/**
 * Selecciona una receta para un turno específico
 */
window.seleccionarReceta = function(diaId, turnoComida, nombreReceta, fotoReceta) {
  const menuSemanal = window.menuSemanalTemporal;
  
  // Actualizar el menú con el objeto de receta
  if (menuSemanal[diaId]) {
    menuSemanal[diaId][turnoComida] = {
      nombreReceta: nombreReceta,
      fotoReceta: fotoReceta || ''
    };
  }
  
  // Obtener el icono del turno
  const comida = COMIDAS.find(c => c.id === turnoComida);
  const iconoTurno = comida ? comida.icon : 'bi-circle';
  
  // Actualizar la UI
  const contenedor = document.getElementById(`receta-${diaId}-${turnoComida}`);
  if (contenedor) {
    if (fotoReceta && fotoReceta.trim() !== '') {
      contenedor.innerHTML = `
        <div class="position-relative mb-2">
          <img src="${fotoReceta}" alt="${nombreReceta}" 
               class="rounded" style="width: 100%; max-width: 150px; height: 100px; object-fit: cover;">
          <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" 
                  onclick="eliminarRecetaDelMenu('${diaId}', '${turnoComida}')" 
                  style="padding: 0.25rem 0.5rem;">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <small class="text-muted">${nombreReceta}</small>
      `;
    } else {
      contenedor.innerHTML = `
        <div class="position-relative mb-2">
          <i class="bi ${iconoTurno} text-primary" style="font-size: 4rem;"></i>
          <button class="btn btn-sm btn-danger position-absolute top-0 end-0" 
                  onclick="eliminarRecetaDelMenu('${diaId}', '${turnoComida}')" 
                  style="padding: 0.25rem 0.5rem;">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <small class="text-muted">${nombreReceta}</small>
      `;
    }
  }
  
  // Cerrar el modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalSeleccionReceta'));
  if (modal) {
    modal.hide();
  }
};

/**
 * Elimina una receta del menú
 */
window.eliminarRecetaDelMenu = function(diaId, turnoComida) {
  const menuSemanal = window.menuSemanalTemporal;
  
  // Actualizar el menú
  if (menuSemanal[diaId]) {
    menuSemanal[diaId][turnoComida] = null;
  }
  
  // Obtener el icono del turno
  const comida = COMIDAS.find(c => c.id === turnoComida);
  const iconoTurno = comida ? comida.icon : 'bi-circle';
  
  // Actualizar la UI
  const contenedor = document.getElementById(`receta-${diaId}-${turnoComida}`);
  if (contenedor) {
    contenedor.innerHTML = `
      <i class="bi ${iconoTurno} text-secondary mb-2" style="font-size: 4rem; opacity: 0.3;"></i>
      <small class="text-muted fst-italic">Vacío</small>
    `;
  }
};

/**
 * Guarda el menú manual en el servidor
 */
async function guardarMenuManual(menuSemanal) {
  try {
    const btnGuardar = document.getElementById('btnGuardarMenuManual');
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    
    // Convertir objetos de receta a solo nombres para el servidor
    const menuParaGuardar = {};
    for (const dia in menuSemanal) {
      menuParaGuardar[dia] = {};
      for (const turno in menuSemanal[dia]) {
        const receta = menuSemanal[dia][turno];
        if (receta && typeof receta === 'object') {
          // Si es un objeto, extraer solo el nombre
          menuParaGuardar[dia][turno] = receta.nombreReceta;
        } else {
          // Si es null o ya es un string, mantenerlo
          menuParaGuardar[dia][turno] = receta;
        }
      }
    }
    
    const response = await fetch('/api/menu-semanal/guardar-manual', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ menuSemanal: menuParaGuardar })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ mensaje: 'Error desconocido' }));
      throw new Error(errorData.mensaje || 'Error al guardar menú');
    }
    
    const data = await response.json();
    
    if (data.exito) {
      mostrarMensaje('Menú semanal guardado correctamente', 'success');
      // Mostrar los botones de editar y eliminar después de guardar
      if (btnEditarMenu) {
        btnEditarMenu.style.display = 'inline-block';
      }
      if (btnEliminarMenu) {
        btnEliminarMenu.style.display = 'inline-block';
      }
      await cargarMenuSemanal();
    } else {
      throw new Error(data.mensaje || 'Error al guardar menú');
    }
    
  } catch (error) {
    console.error('Error al guardar menú manual:', error);
    mostrarMensaje('Error al guardar el menú: ' + error.message, 'error');
    
    const btnGuardar = document.getElementById('btnGuardarMenuManual');
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '<i class="bi bi-check-circle"></i> Guardar Menú';
    }
  }
}

/**
 * Abre un modal informativo con los detalles de una receta
 * @param {string} nombreReceta - Nombre de la receta a mostrar
 */
async function abrirModalInfoReceta(nombreReceta) {
  try {
    // Obtener el ID de la receta
    const responseId = await fetch(`/api/receta-id/${encodeURIComponent(nombreReceta)}`);
    if (!responseId.ok) {
      const errorData = await responseId.json();
      console.error('Error al obtener ID:', errorData);
      mostrarMensaje('No se pudo cargar la receta', 'error');
      return;
    }
    const dataId = await responseId.json();
    if (!dataId.exito || !dataId.receta_id) {
      console.error('Respuesta ID incorrecta:', dataId);
      mostrarMensaje('No se pudo obtener el ID de la receta', 'error');
      return;
    }
    const recetaId = dataId.receta_id;
    console.log('ID de receta obtenido:', recetaId);
    
    // Obtener los detalles completos de la receta
    const responseDetalle = await fetch(`/api/receta/${recetaId}`);
    if (!responseDetalle.ok) {
      const errorData = await responseDetalle.json();
      console.error('Error al obtener detalles:', errorData);
      mostrarMensaje('No se pudo cargar los detalles de la receta', 'error');
      return;
    }
    const resultado = await responseDetalle.json();
    
    if (!resultado.exito || !resultado.receta) {
      console.error('Respuesta detalle incorrecta:', resultado);
      mostrarMensaje('No se encontraron detalles de la receta', 'error');
      return;
    }
    
    const receta = resultado.receta;
    console.log('Receta obtenida:', receta);
    
    // Llenar el modal con los datos
    document.getElementById('tituloRecetaInfo').textContent = receta.nombreReceta || 'Sin nombre';
    document.getElementById('descripcionRecetaInfo').textContent = receta.descripcion || 'Sin descripción';
    
    // Formatear duración
    const duracion = receta.duracion || 0;
    let duracionTexto = '-';
    if (duracion > 0) {
      const horas = Math.floor(duracion / 60);
      const minutos = duracion % 60;
      if (horas > 0 && minutos > 0) {
        duracionTexto = `${horas}h ${minutos}min`;
      } else if (horas > 0) {
        duracionTexto = `${horas}h`;
      } else {
        duracionTexto = `${minutos}min`;
      }
    }
    document.getElementById('duracionRecetaInfo').textContent = duracionTexto;
    document.getElementById('dificultadRecetaInfo').textContent = receta.dificultad || 'No especificada';
    document.getElementById('paisRecetaInfo').textContent = receta.paisOrigen || 'No especificado';
    
    const turnoComida = receta.turnoComida || 'No especificado';
    document.getElementById('turnoRecetaInfo').textContent = 
      turnoComida.charAt(0).toUpperCase() + turnoComida.slice(1).toLowerCase();
    
    // Mostrar imagen si existe
    const imagenContainer = document.getElementById('imagenRecetaInfo');
    if (receta.fotoReceta) {
      imagenContainer.style.display = 'block';
      imagenContainer.querySelector('img').src = receta.fotoReceta;
      imagenContainer.querySelector('img').alt = `Foto de ${receta.nombreReceta}`;
    } else {
      imagenContainer.style.display = 'none';
    }
    
    // Mostrar ingredientes
    const ingredientesContainer = document.getElementById('ingredientesRecetaInfo');
    if (receta.ingredientes) {
      // Convertir a array si es string
      const ingredientesArray = Array.isArray(receta.ingredientes) 
        ? receta.ingredientes 
        : receta.ingredientes.split(',').map(ing => ing.trim());
      
      if (ingredientesArray.length > 0) {
        ingredientesContainer.innerHTML = '<ul class="list-unstyled mb-0">' +
          ingredientesArray.map(ing => `<li><i class="bi bi-check2 text-success me-2"></i>${ing}</li>`).join('') +
          '</ul>';
      } else {
        ingredientesContainer.innerHTML = '<p class="text-muted mb-0">No se han especificado ingredientes.</p>';
      }
    } else {
      ingredientesContainer.innerHTML = '<p class="text-muted mb-0">No se han especificado ingredientes.</p>';
    }
    
    // Mostrar pasos
    const pasosContainer = document.getElementById('pasosRecetaInfo');
    if (receta.pasosAseguir) {
      // Convertir a array si es string
      const pasosArray = Array.isArray(receta.pasosAseguir) 
        ? receta.pasosAseguir 
        : receta.pasosAseguir.split(',').map(paso => paso.trim());
      
      if (pasosArray.length > 0) {
        pasosContainer.innerHTML = '<ol class="mb-0">' +
          pasosArray.map(paso => `<li class="mb-2">${paso}</li>`).join('') +
          '</ol>';
      } else {
        pasosContainer.innerHTML = '<p class="text-muted mb-0">No se han especificado pasos.</p>';
      }
    } else {
      pasosContainer.innerHTML = '<p class="text-muted mb-0">No se han especificado pasos.</p>';
    }
    
    // Mostrar alérgenos
    const alergenosContainer = document.getElementById('alergenosRecetaInfo');
    if (receta.alergenos) {
      // Convertir a array si es string
      const alergenosArray = Array.isArray(receta.alergenos) 
        ? receta.alergenos 
        : receta.alergenos.split(',').map(alergeno => alergeno.trim());
      
      if (alergenosArray.length > 0) {
        alergenosContainer.innerHTML = '<div class="d-flex flex-wrap gap-2">' +
          alergenosArray.map(alergeno => 
            `<span class="badge bg-danger">${alergeno}</span>`
          ).join('') +
          '</div>';
      } else {
        alergenosContainer.innerHTML = '<p class="text-muted mb-0">No se han especificado alérgenos.</p>';
      }
    } else {
      alergenosContainer.innerHTML = '<p class="text-muted mb-0">No se han especificado alérgenos.</p>';
    }
    
    // Abrir el modal
    const modalElement = document.getElementById('modalInfoReceta');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
  } catch (error) {
    console.error('Error al abrir modal de receta:', error);
    mostrarMensaje('Error al cargar los detalles de la receta', 'error');
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarMenuSemanal);
} else {
  inicializarMenuSemanal();
}
