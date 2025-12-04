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
  { id: 'aperitivo', nombre: 'Aperitivo', icon: 'bi-egg' },
  { id: 'comida', nombre: 'Comida', icon: 'bi-bowl-hot' },
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
      renderizarMenuSemanal(data.menuSemanal);
      mostrarEstado('menu');
      mostrarMensaje('Menú semanal creado automáticamente', 'success');
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
    
    const response = await fetch('/api/menu-semanal/crear-manual', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ mensaje: 'Error desconocido' }));
      throw new Error(errorData.mensaje || 'Error al crear menú manual');
    }
    
    const data = await response.json();
    
    if (data.exito && data.menuSemanal) {
      renderizarMenuSemanal(data.menuSemanal);
      mostrarEstado('menu');
      mostrarMensaje('Menú semanal creado para edición manual', 'success');
    } else {
      throw new Error(data.mensaje || 'Error al crear menú manual');
    }
    
  } catch (error) {
    console.error('Error al crear menú manual:', error);
    mostrarMensaje('Error al crear el menú manual: ' + error.message, 'error');
  } finally {
    btnCrearManual.disabled = false;
    btnCrearManual.innerHTML = '<i class="bi bi-pencil-square"></i> Crear Menú Manual';
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
  cardBody.className = 'card-body text-center';
  
  const icon = document.createElement('i');
  icon.className = `bi ${comida.icon} text-primary fs-4`;
  
  const titulo = document.createElement('h6');
  titulo.className = 'card-title mt-2 mb-3';
  titulo.textContent = comida.nombre;
  
  const contenido = document.createElement('div');
  
  if (receta && receta !== null) {
    // Hay una receta asignada
    contenido.className = 'text-muted small';
    contenido.textContent = receta;
  } else {
    // No hay receta asignada - indicar que no hay recetas para este turno
    contenido.className = 'text-warning small fst-italic';
    contenido.innerHTML = '<i class="bi bi-exclamation-circle me-1"></i>No hay recetas para este turno';
  }
  
  cardBody.appendChild(icon);
  cardBody.appendChild(titulo);
  cardBody.appendChild(contenido);
  card.appendChild(cardBody);
  
  return card;
}

/**
 * Muestra el estado correspondiente (loading, empty, menu)
 */
function mostrarEstado(estado) {
  loadingState.style.display = 'none';
  emptyState.style.display = 'none';
  menuSemanalContainer.style.display = 'none';
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
      btnEliminarMenu.style.display = 'inline-block';
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

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarMenuSemanal);
} else {
  inicializarMenuSemanal();
}
