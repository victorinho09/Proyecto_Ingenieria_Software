import { mostrarMensaje } from '/static/js/components/message-handler.js';

// Módulo para manejar la sección de perfil
export async function cargarPerfil() {
  try {
    const res = await fetch('/api/perfil', { credentials: 'include' });
    const json = await res.json();
    if (!res.ok) {
      console.error('Error al obtener perfil', json);
      return;
    }

    const perfilObj = json.data && json.data.perfil ? json.data.perfil : (json.perfil ? json.perfil : json.data);
    const p = perfilObj || {};

    const perfilEmailEl = document.getElementById('perfilEmail');
    const perfilNombreEl = document.getElementById('perfilNombre');
    if (perfilEmailEl) perfilEmailEl.textContent = p.email || '';
    if (perfilNombreEl) perfilNombreEl.textContent = p.nombreUsuario || '';

    // Also update hero area (visual)
    const heroNombreEl = document.getElementById('heroNombre');
    const heroEmailEl = document.getElementById('heroEmail');
    const heroAvatar = document.getElementById('heroAvatarImg');
    if (heroNombreEl) heroNombreEl.textContent = p.nombreUsuario || '';
    if (heroEmailEl) heroEmailEl.textContent = p.email || '';
    function applyHeroAvatar(url, hasUserPhoto) {
      try {
        if (!heroAvatar) return;
        // If no user photo, use container background to guarantee clipping
        if (!hasUserPhoto || !url || url.endsWith('/cocinero.png') || url.includes('cocinero.png')) {
          // hide the <img> and use background-image on the container
          heroAvatar.style.display = 'none';
          // mark the img with 'contain' so modal preview logic can mirror this behavior
          try { heroAvatar.classList.add('contain'); } catch(e){}
          const parent = heroAvatar.parentElement;
          if (parent) {
            parent.classList.add('default-icon');
            parent.style.backgroundImage = `url(${url || '/static/cocinero.png'})`;
            // background-size controlled via CSS (.default-icon)
          }
          // mark hero-inner to allow smaller gap when default icon is used
          try { const heroInner = heroAvatar.parentElement && heroAvatar.parentElement.parentElement; if (heroInner) heroInner.classList.add('default-avatar'); } catch(e){}
          // mark modal preview to match
        } else {
          // show the <img> element and clear container background
          heroAvatar.style.display = 'block';
          heroAvatar.src = url;
          try { heroAvatar.classList.remove('contain'); } catch(e){}
          const parent = heroAvatar.parentElement;
          if (parent) {
            parent.classList.remove('default-icon');
            parent.style.backgroundImage = '';
          }
          try { const heroInner = heroAvatar.parentElement && heroAvatar.parentElement.parentElement; if (heroInner) heroInner.classList.remove('default-avatar'); } catch(e){}
        }
      } catch (e) { console.error('Error applying hero avatar', e); }
    }

    if (p.fotoPerfil) {
      applyHeroAvatar(p.fotoPerfil, true);
    } else {
      applyHeroAvatar('/static/cocinero.png', false);
    }

    const countPropiasEl = document.getElementById('countPropias');
    const countGuardadasEl = document.getElementById('countGuardadas');
    const countHechasEl = document.getElementById('countHechas');
    if (countPropiasEl) countPropiasEl.textContent = p.totalPublicadas ?? p.totalPropias ?? 0;
    if (countGuardadasEl) countGuardadasEl.textContent = p.totalGuardadas ?? 0;
    if (countHechasEl) countHechasEl.textContent = p.totalHechas ?? 0;

    // Cargar preview de recetas y asignar listeners a tiles
    try { cargarPreviewRecetas(); } catch(e) { console.error('Error cargando preview de recetas', e); }

    const perfilValoracionEl = document.getElementById('perfilValoracion');
    const perfilValoracionNumero = document.getElementById('perfilValoracionNumero');
    const perfilValoracionStars = document.getElementById('perfilValoracionStars');
    const val = (typeof p.valoracion !== 'undefined' && p.valoracion !== null) ? Number(p.valoracion) : null;
    if (perfilValoracionNumero) perfilValoracionNumero.textContent = val !== null ? val.toFixed(1) : '—';
    if (perfilValoracionStars) {
      perfilValoracionStars.innerHTML = '';
      const score = val !== null ? val : 0;
      for (let i = 1; i <= 5; i++) {
        const iEl = document.createElement('i');
        if (i <= Math.floor(score)) {
          iEl.className = 'bi bi-star-fill';
        } else if (i === Math.ceil(score) && score % 1 !== 0) {
          iEl.className = 'bi bi-star-half';
        } else {
          iEl.className = 'bi bi-star';
        }
        perfilValoracionStars.appendChild(iEl);
      }
    }

    // Mostrar contador de valoraciones si viene del servidor
    const perfilValoracionCountEl = document.getElementById('perfilValoracionCount');
    const count = (typeof p.valoracion_count !== 'undefined' && p.valoracion_count !== null) ? Number(p.valoracion_count) : null;
    if (perfilValoracionCountEl) {
      if (count === null || count === 0) {
        perfilValoracionCountEl.textContent = 'Sin valoraciones aún';
      } else if (count === 1) {
        perfilValoracionCountEl.textContent = 'Basado en 1 valoración';
      } else {
        perfilValoracionCountEl.textContent = `Basado en ${count} valoraciones`;
      }
    }

    // La valoración del perfil se obtiene desde el servidor en `p.valoracion`.

  } catch (err) {
    console.error('Error cargando perfil:', err);
  }

  // Update navbar if available
  try {
    if (window.actualizarNavbarUsuario) window.actualizarNavbarUsuario();
    if (window.updateSiteHeroFromProfile) window.updateSiteHeroFromProfile();
  } catch (e) {
    console.error('Error actualizando navbar', e);
  }
}

export async function subirFoto(archivo) {
  const mensaje = document.getElementById('mensajeFoto');
  if (mensaje) mensaje.style.display = 'none';
  try {
    const form = new FormData();
    form.append('archivo', archivo);

    const res = await fetch('/api/subir-foto-perfil', { method: 'POST', credentials: 'include', body: form });
    const json = await res.json();
    if (!res.ok) {
      if (mensaje) {
        mensaje.className = 'alert alert-danger small mt-2';
        mensaje.textContent = json.mensaje || 'Error subiendo la foto';
        mensaje.style.display = 'block';
      }
      return;
    }

    const fotoUrl = json.data?.fotoPerfil || json.fotoPerfil;
    if (fotoUrl) {
      try {
        const heroAvatarEl = document.getElementById('heroAvatarImg');
          if (heroAvatarEl) {
            // ensure the <img> is visible and clears any container background used for the default icon
            heroAvatarEl.style.display = 'block';
            heroAvatarEl.src = fotoUrl;
            heroAvatarEl.classList.remove('contain');
            const parent = heroAvatarEl.parentElement;
            if (parent) parent.style.backgroundImage = '';
        }
      } catch(e){}
      try { if (window.actualizarNavbarUsuario) window.actualizarNavbarUsuario(); } catch (e) {}
      if (mensaje) { mensaje.className = 'alert alert-success small mt-2'; mensaje.textContent = 'Foto subida correctamente'; mensaje.style.display = 'block'; }
    }
  } catch (err) {
    if (mensaje) {
      mensaje.className = 'alert alert-danger small mt-2';
      mensaje.textContent = 'Error de conexión al subir la foto';
      mensaje.style.display = 'block';
    }
  }
}

// Nota: la media ya la calcula y persiste el servidor; no hacer peticiones por receta desde el cliente.

// Initialize modal wiring when DOM is ready
export function inicializarPerfilModales() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPerfilModales);
    return;
  }

  // Guarded references
  const btnEditar = document.getElementById('btnEditarPerfil');
  const btnEditarHero = document.getElementById('btnEditarPerfilHero');

  const perfilEditModalEl = document.getElementById('perfilEditModal');
  const perfilEditModalInstance = perfilEditModalEl ? new bootstrap.Modal(perfilEditModalEl) : null;
  const modalPerfilNombreInput = document.getElementById('modalPerfilNombreInput');
  const modalPerfilFotoInput = document.getElementById('modalPerfilFotoInput');
  const modalPerfilImagenPreview = document.getElementById('modalPerfilImagenPreview');
  const modalPerfilQuitarFoto = document.getElementById('modalPerfilQuitarFoto');
  const modalPerfilGuardarBtn = document.getElementById('modalPerfilGuardar');
  const modalPerfilMensaje = document.getElementById('modalPerfilMensaje');
  // Password-in-profile elements
  const toggleCambiarPassBtn = document.getElementById('toggleCambiarPassBtn');
  const passwordSection = document.getElementById('passwordSection');
  const modalPerfilPassActual = document.getElementById('modalPerfilPassActual');
  const modalPerfilPassNueva = document.getElementById('modalPerfilPassNueva');
  const modalPerfilPassConfirm = document.getElementById('modalPerfilPassConfirm');
  const modalPerfilGuardarPassword = document.getElementById('modalPerfilGuardarPassword');
  const modalPerfilMensajePasswordInPerfil = document.getElementById('modalPerfilMensajePassword');
  let _modalPerfilMsgTimeout = null;

  function openPerfilEditModal() {
    try {
      const perfilNombre = document.getElementById('perfilNombre') || document.getElementById('heroNombre');
      if (modalPerfilNombreInput && perfilNombre) modalPerfilNombreInput.value = perfilNombre.textContent.trim();
      const heroAvatar = document.getElementById('heroAvatarImg');
      if (modalPerfilImagenPreview) modalPerfilImagenPreview.src = (heroAvatar && heroAvatar.src) ? heroAvatar.src : '/static/cocinero.png';
      // Enable/disable the "Quitar foto" button depending on whether current image is default
      try {
        if (modalPerfilQuitarFoto) {
          const src = modalPerfilImagenPreview ? (modalPerfilImagenPreview.src || '') : '';
          const isDefault = !src || src.includes('/cocinero.png') || src.endsWith('cocinero.png');
          modalPerfilQuitarFoto.disabled = isDefault;
        }
      } catch(e){}
      if (perfilEditModalInstance) perfilEditModalInstance.show();
    } catch (e) { console.error('Error abriendo modal de edición', e); }
  }

  if (perfilEditModalEl) {
    perfilEditModalEl.addEventListener('show.bs.modal', () => {
      try {
        const perfilNombre = document.getElementById('perfilNombre') || document.getElementById('heroNombre');
        const heroAvatar = document.getElementById('heroAvatarImg');
        if (modalPerfilNombreInput && perfilNombre) modalPerfilNombreInput.value = perfilNombre.textContent.trim();
        if (modalPerfilImagenPreview) {
          modalPerfilImagenPreview.src = (heroAvatar && heroAvatar.src) ? heroAvatar.src : '/static/cocinero.png';
          // mirror contain class from hero so preview matches behavior
          try { if (heroAvatar && heroAvatar.classList.contains('contain')) modalPerfilImagenPreview.classList.add('contain'); else modalPerfilImagenPreview.classList.remove('contain'); } catch(e){}
          // toggle quitar boton availability
          try {
            if (modalPerfilQuitarFoto) {
              const src = modalPerfilImagenPreview.src || '';
              const isDefault = !src || src.includes('/cocinero.png') || src.endsWith('cocinero.png');
              modalPerfilQuitarFoto.disabled = isDefault;
            }
          } catch(e){}
        }
      } catch (e) { console.error('Error prefilling perfil modal', e); }
    });
    // When the modal is hidden, reset password section, messages and inputs to avoid sticky state
    perfilEditModalEl.addEventListener('hidden.bs.modal', () => {
      try {
        // hide password section and clear its fields/messages
        if (passwordSection) passwordSection.style.display = 'none';
        if (modalPerfilPassActual) modalPerfilPassActual.value = '';
        if (modalPerfilPassNueva) modalPerfilPassNueva.value = '';
        if (modalPerfilPassConfirm) modalPerfilPassConfirm.value = '';
        if (modalPerfilMensajePasswordInPerfil) {
          modalPerfilMensajePasswordInPerfil.style.display = 'none';
          modalPerfilMensajePasswordInPerfil.textContent = '';
          modalPerfilMensajePasswordInPerfil.className = '';
        }
        // reset general modal messages
        if (modalPerfilMensaje) { modalPerfilMensaje.style.display = 'none'; modalPerfilMensaje.textContent = ''; modalPerfilMensaje.className = ''; }
        if (_modalPerfilMsgTimeout) { clearTimeout(_modalPerfilMsgTimeout); _modalPerfilMsgTimeout = null; }
        // restore preview image from hero (in case user selected a local file)
        const heroAvatar = document.getElementById('heroAvatarImg');
        if (modalPerfilImagenPreview) {
          modalPerfilImagenPreview.src = (heroAvatar && heroAvatar.src) ? heroAvatar.src : '/static/cocinero.png';
          try { if (heroAvatar && heroAvatar.classList.contains('contain')) modalPerfilImagenPreview.classList.add('contain'); else modalPerfilImagenPreview.classList.remove('contain'); } catch(e){}
        }
        // clear file input value to release objectURL and avoid stale preview
        if (modalPerfilFotoInput) {
          try { modalPerfilFotoInput.value = null; } catch(e) { /* ignore */ }
        }
        // restore name input to current profile name
        const perfilNombre = document.getElementById('perfilNombre') || document.getElementById('heroNombre');
        if (modalPerfilNombreInput && perfilNombre) modalPerfilNombreInput.value = perfilNombre.textContent.trim();
        // Remove focus from the edit buttons; use setTimeout so this runs after
        // Bootstrap restores focus to the triggering element.
        try {
          setTimeout(() => {
            try { if (btnEditarHero && typeof btnEditarHero.blur === 'function') btnEditarHero.blur(); } catch(e){}
            try { if (btnEditar && typeof btnEditar.blur === 'function') btnEditar.blur(); } catch(e){}
            try { if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur(); } catch(e){}
            // Ensure the modal save button is enabled when modal closes
            try { if (modalPerfilGuardarBtn) modalPerfilGuardarBtn.disabled = false; } catch(e){}
          }, 50);
        } catch(e){}
      } catch (e) { console.error('Error resetting perfil modal on hide', e); }
    });
  }

  if (btnEditar) btnEditar.addEventListener('click', openPerfilEditModal);
  if (btnEditarHero) btnEditarHero.addEventListener('click', openPerfilEditModal);

  if (modalPerfilFotoInput) {
    modalPerfilFotoInput.addEventListener('change', (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      try {
        const url = URL.createObjectURL(f);
        if (modalPerfilImagenPreview) {
          modalPerfilImagenPreview.src = url;
          // uploaded preview should fill the circle (cover)
          try { modalPerfilImagenPreview.classList.remove('contain'); } catch(e){}
        }
      } catch (e) {}
    });
  }

  // Handler para quitar/restaurar la foto de perfil a la imagen por defecto
  if (modalPerfilQuitarFoto) {
    modalPerfilQuitarFoto.addEventListener('click', async () => {
      try {
        modalPerfilQuitarFoto.disabled = true;
        if (modalPerfilMensaje) { modalPerfilMensaje.style.display = 'none'; }
        const res = await fetch('/api/eliminar-foto-perfil', { method: 'POST', credentials: 'include' });
        const j = await res.json();
        if (!res.ok) {
          if (modalPerfilMensaje) { modalPerfilMensaje.className = 'alert alert-danger small mt-2'; modalPerfilMensaje.textContent = j.mensaje || 'Error al quitar la foto'; modalPerfilMensaje.style.display = 'block'; }
          if (_modalPerfilMsgTimeout) clearTimeout(_modalPerfilMsgTimeout);
          _modalPerfilMsgTimeout = setTimeout(()=>{ if (modalPerfilMensaje) { modalPerfilMensaje.style.display='none'; modalPerfilMensaje.textContent=''; modalPerfilMensaje.className=''; } _modalPerfilMsgTimeout = null; }, 3500);
          modalPerfilQuitarFoto.disabled = false;
          return;
        }

        // Actualizar vista: preview y hero refrescado desde servidor
        if (modalPerfilImagenPreview) {
          // set immediately to the default image returned by server (or fallback)
          const defaultUrl = j.data?.fotoPerfil || j.fotoPerfil || '/static/cocinero.png';
          modalPerfilImagenPreview.src = defaultUrl;
          // make sure preview shows the default icon fully (use contain behavior)
          try { modalPerfilImagenPreview.style.display = 'block'; } catch(e){}
          try { if (modalPerfilImagenPreview.classList) modalPerfilImagenPreview.classList.add('contain'); } catch(e){}
        }
        if (modalPerfilFotoInput) { try { modalPerfilFotoInput.value = null; } catch(e){} }
        // Force hero area to show the default icon so reopening modal copies it correctly
        try {
          const heroAvatarEl = document.getElementById('heroAvatarImg');
          if (heroAvatarEl) {
            heroAvatarEl.src = '/static/cocinero.png';
            heroAvatarEl.style.display = 'block';
            try { heroAvatarEl.classList.add('contain'); } catch(e){}
            // clear any parent background used for default-state rendering
            try { if (heroAvatarEl.parentElement) heroAvatarEl.parentElement.style.backgroundImage = ''; } catch(e){}
          }
        } catch(e){}
        // Refresh profile data (this will update hero); but also set modal preview again after refresh
        try { await cargarPerfil(); } catch(e) { console.error(e); }
        try {
          // ensure modal preview remains default after perfil refresh
          if (modalPerfilImagenPreview) {
            modalPerfilImagenPreview.src = j.data?.fotoPerfil || j.fotoPerfil || '/static/cocinero.png';
            try { modalPerfilImagenPreview.classList.add('contain'); } catch(e){}
          }
        } catch(e){}
        try { mostrarMensaje(j.mensaje || 'Foto restaurada', 'success'); } catch(e){}
        // Leave the modal open but set UI to 'no-photo' state: disable quitar button
        try { if (modalPerfilQuitarFoto) modalPerfilQuitarFoto.disabled = true; } catch(e){}
        // Do not show a success alert inside the modal; only use the floating message.
        try { if (modalPerfilMensaje) { modalPerfilMensaje.style.display = 'none'; modalPerfilMensaje.textContent = ''; modalPerfilMensaje.className = ''; } } catch(e) {}
      } catch (err) {
        if (modalPerfilMensaje) { modalPerfilMensaje.className = 'alert alert-danger small mt-2'; modalPerfilMensaje.textContent = 'Error de conexión al quitar la foto'; modalPerfilMensaje.style.display = 'block'; }
        if (_modalPerfilMsgTimeout) clearTimeout(_modalPerfilMsgTimeout);
        _modalPerfilMsgTimeout = setTimeout(()=>{ if (modalPerfilMensaje) { modalPerfilMensaje.style.display='none'; modalPerfilMensaje.textContent=''; modalPerfilMensaje.className=''; } _modalPerfilMsgTimeout = null; }, 3500);
      } finally {
        // always re-enable the button to avoid stuck state
        try { modalPerfilQuitarFoto.disabled = false; } catch(e){}
      }
    });
  }

  // Toggle mostrar sección de cambiar contraseña dentro del modal de perfil
  if (toggleCambiarPassBtn && passwordSection) {
    toggleCambiarPassBtn.addEventListener('click', () => {
      const isHidden = passwordSection.style.display === 'none' || passwordSection.style.display === '';
      passwordSection.style.display = isHidden ? 'block' : 'none';
      if (!isHidden) {
        // ocultando: limpiar campos
        if (modalPerfilPassActual) modalPerfilPassActual.value = '';
        if (modalPerfilPassNueva) modalPerfilPassNueva.value = '';
        if (modalPerfilPassConfirm) modalPerfilPassConfirm.value = '';
        if (modalPerfilMensajePasswordInPerfil) {
          modalPerfilMensajePasswordInPerfil.style.display = 'none';
          modalPerfilMensajePasswordInPerfil.textContent = '';
          modalPerfilMensajePasswordInPerfil.className = '';
        }
      } else {
        // mostrar: focus en actual
        setTimeout(() => { if (modalPerfilPassActual) modalPerfilPassActual.focus(); }, 120);
      }
    });
  }

  // Handler para cambiar contraseña desde el modal de perfil
  // Keep a timeout handle so messages auto-hide and don't get stuck
  let _perfilPassMsgTimeout = null;

  if (modalPerfilGuardarPassword) {
    modalPerfilGuardarPassword.addEventListener('click', async () => {
      if (modalPerfilMensajePasswordInPerfil) {
        modalPerfilMensajePasswordInPerfil.style.display = 'none';
        modalPerfilMensajePasswordInPerfil.textContent = '';
        modalPerfilMensajePasswordInPerfil.className = '';
      }
      if (_perfilPassMsgTimeout) { clearTimeout(_perfilPassMsgTimeout); _perfilPassMsgTimeout = null; }
      const actual = modalPerfilPassActual ? modalPerfilPassActual.value : '';
      const nueva = modalPerfilPassNueva ? modalPerfilPassNueva.value : '';
      const confirm = modalPerfilPassConfirm ? modalPerfilPassConfirm.value : '';

      if (!actual || !nueva || !confirm) {
        if (modalPerfilMensajePasswordInPerfil) {
          modalPerfilMensajePasswordInPerfil.className = 'alert alert-danger small mt-2';
          modalPerfilMensajePasswordInPerfil.textContent = 'Rellena todos los campos';
          modalPerfilMensajePasswordInPerfil.style.display = 'block';
        }
        return;
      }
      if (nueva !== confirm) {
        if (modalPerfilMensajePasswordInPerfil) {
          modalPerfilMensajePasswordInPerfil.className = 'alert alert-danger small mt-2';
          modalPerfilMensajePasswordInPerfil.textContent = 'La nueva contraseña y la confirmación no coinciden';
          modalPerfilMensajePasswordInPerfil.style.display = 'block';
        }
        return;
      }
      if (actual === nueva) {
        if (modalPerfilMensajePasswordInPerfil) {
          modalPerfilMensajePasswordInPerfil.className = 'alert alert-danger small mt-2';
          modalPerfilMensajePasswordInPerfil.textContent = 'La nueva contraseña no puede ser igual a la actual';
          modalPerfilMensajePasswordInPerfil.style.display = 'block';
        }
        return;
      }

      modalPerfilGuardarPassword.disabled = true;
      try {
        const res = await fetch('/api/cambiar-password', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: actual, newPassword: nueva, confirmPassword: confirm }) });
        const j = await res.json();
        if (!res.ok) {
          if (modalPerfilMensajePasswordInPerfil) {
            modalPerfilMensajePasswordInPerfil.className = 'alert alert-danger small mt-2';
            modalPerfilMensajePasswordInPerfil.textContent = j.mensaje || 'Error al cambiar la contraseña';
            modalPerfilMensajePasswordInPerfil.style.display = 'block';
          }
          // auto-hide mensaje tras 4s
          if (_perfilPassMsgTimeout) clearTimeout(_perfilPassMsgTimeout);
          _perfilPassMsgTimeout = setTimeout(() => {
            if (modalPerfilMensajePasswordInPerfil) {
              modalPerfilMensajePasswordInPerfil.style.display = 'none';
              modalPerfilMensajePasswordInPerfil.textContent = '';
              modalPerfilMensajePasswordInPerfil.className = '';
            }
            _perfilPassMsgTimeout = null;
          }, 4000);
          modalPerfilGuardarPassword.disabled = false;
          return;
        }

        if (modalPerfilMensajePasswordInPerfil) {
          modalPerfilMensajePasswordInPerfil.className = 'alert alert-success small mt-2';
          modalPerfilMensajePasswordInPerfil.textContent = j.mensaje || 'Contraseña cambiada correctamente';
          modalPerfilMensajePasswordInPerfil.style.display = 'block';
        }
        try { mostrarMensaje(j.mensaje || 'Contraseña cambiada correctamente', 'success'); } catch(e){}
        // limpiar campos y ocultar sección
        if (modalPerfilPassActual) modalPerfilPassActual.value = '';
        if (modalPerfilPassNueva) modalPerfilPassNueva.value = '';
        if (modalPerfilPassConfirm) modalPerfilPassConfirm.value = '';
        if (passwordSection) passwordSection.style.display = 'none';
        // auto-hide success mensaje tras 3s
        if (_perfilPassMsgTimeout) clearTimeout(_perfilPassMsgTimeout);
        _perfilPassMsgTimeout = setTimeout(() => {
          if (modalPerfilMensajePasswordInPerfil) {
            modalPerfilMensajePasswordInPerfil.style.display = 'none';
            modalPerfilMensajePasswordInPerfil.textContent = '';
            modalPerfilMensajePasswordInPerfil.className = '';
          }
          _perfilPassMsgTimeout = null;
        }, 3000);
      } catch (err) {
        if (modalPerfilMensajePasswordInPerfil) {
          modalPerfilMensajePasswordInPerfil.className = 'alert alert-danger small mt-2';
          modalPerfilMensajePasswordInPerfil.textContent = 'Error de conexión al cambiar la contraseña';
          modalPerfilMensajePasswordInPerfil.style.display = 'block';
        }
        if (_perfilPassMsgTimeout) clearTimeout(_perfilPassMsgTimeout);
        _perfilPassMsgTimeout = setTimeout(() => {
          if (modalPerfilMensajePasswordInPerfil) {
            modalPerfilMensajePasswordInPerfil.style.display = 'none';
            modalPerfilMensajePasswordInPerfil.textContent = '';
            modalPerfilMensajePasswordInPerfil.className = '';
          }
          _perfilPassMsgTimeout = null;
        }, 4000);
      } finally {
        modalPerfilGuardarPassword.disabled = false;
      }
    });
  }

  if (modalPerfilGuardarBtn) {
    modalPerfilGuardarBtn.addEventListener('click', async () => {
      if (modalPerfilMensaje) modalPerfilMensaje.style.display = 'none';
      modalPerfilGuardarBtn.disabled = true;
      try {
        const newName = modalPerfilNombreInput ? modalPerfilNombreInput.value.trim() : '';
        // Prevent empty username submission
        if (!newName) {
          if (modalPerfilMensaje) {
            modalPerfilMensaje.className = 'alert alert-danger small mt-2';
            modalPerfilMensaje.textContent = 'El nombre de usuario no puede quedar vacío';
            modalPerfilMensaje.style.display = 'block';
          }
          modalPerfilGuardarBtn.disabled = false;
          try { if (modalPerfilNombreInput) modalPerfilNombreInput.focus(); } catch(e){}
          return;
        }
        const file = modalPerfilFotoInput ? modalPerfilFotoInput.files[0] : null;

        if (file) {
          const form = new FormData();
          form.append('archivo', file);
          const rf = await fetch('/api/subir-foto-perfil', { method: 'POST', credentials: 'include', body: form });
          const jf = await rf.json();
          if (!rf.ok) {
            if (modalPerfilMensaje) {
              modalPerfilMensaje.className = 'alert alert-danger small mt-2';
              modalPerfilMensaje.textContent = jf.mensaje || 'Error subiendo la foto';
              modalPerfilMensaje.style.display = 'block';
            }
            modalPerfilGuardarBtn.disabled = false;
            return;
          }
        }

        const currentNameEl = document.getElementById('perfilNombre') || document.getElementById('heroNombre');
        const currentName = currentNameEl ? currentNameEl.textContent.trim() : '';
        if (newName && newName !== currentName) {
          const rn = await fetch('/api/actualizar-usuario', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombreUsuario: newName }) });
          const jn = await rn.json();
          if (!rn.ok) {
            if (modalPerfilMensaje) {
              modalPerfilMensaje.className = 'alert alert-danger small mt-2';
              modalPerfilMensaje.textContent = jn.mensaje || 'Error actualizando nombre';
              modalPerfilMensaje.style.display = 'block';
            }
            modalPerfilGuardarBtn.disabled = false;
            return;
          }
        }

        try { mostrarMensaje('Perfil actualizado correctamente', 'success'); } catch (e) {}
        await cargarPerfil();
        try { if (window.actualizarNavbarUsuario) window.actualizarNavbarUsuario(); } catch (e) { console.error(e); }
        if (perfilEditModalInstance) perfilEditModalInstance.hide();
      } catch (err) {
        if (modalPerfilMensaje) {
          modalPerfilMensaje.className = 'alert alert-danger small mt-2';
          modalPerfilMensaje.textContent = 'Error de conexión al guardar cambios';
          modalPerfilMensaje.style.display = 'block';
        }
      } finally {
        modalPerfilGuardarBtn.disabled = false;
      }
    });
  }

  // Handlers y lógica para sección Recetas interactiva
  const tilePropias = document.getElementById('tilePropias');
  const tileHechas = document.getElementById('tileHechas');
  const tileGuardadas = document.getElementById('tileGuardadas');
  const btnVerTodas = document.getElementById('btnVerTodasRecetas');
  const misRecetasModalEl = document.getElementById('misRecetasModal');
  const misRecetasModalInstance = misRecetasModalEl ? new bootstrap.Modal(misRecetasModalEl) : null;

  // Cambiar comportamiento: navegar a la página correspondiente en lugar de abrir modal
  if (tilePropias) tilePropias.addEventListener('click', () => { window.location.href = '/mis-recetas?publicada=si'; });
  if (tileHechas) tileHechas.addEventListener('click', () => { window.location.href = '/mis-recetas'; });
  if (tileGuardadas) {
    // Ensure the suppression flag is set as early as possible (pointerdown/touchstart)
    const setSuppressFlag = () => {
      try { if (window.sessionStorage) window.sessionStorage.setItem('suppressNextFlash', '1'); } catch(e) {}
    };

    tileGuardadas.addEventListener('pointerdown', setSuppressFlag, { passive: true });
    tileGuardadas.addEventListener('touchstart', setSuppressFlag, { passive: true });

    tileGuardadas.addEventListener('click', () => {
      // Fallback: ensure flag is set immediately before navigating
      setSuppressFlag();
      window.location.href = '/recetas-guardadas';
    });
  }
  if (btnVerTodas) btnVerTodas.addEventListener('click', () => { window.location.href = '/mis-recetas'; });

  // Cargar preview: últimas 3 recetas propias (mini thumbnails)
  async function cargarPreviewRecetas() {
    try {
      const res = await fetch('/api/mis-recetas', { credentials: 'include' });
      const j = await res.json();
      if (!res.ok) return;
      const recetas = j.data?.recetas || j.recetas || [];
      const cont = document.getElementById('recetasPreview');
      if (!cont) return;
      cont.innerHTML = '';
      const latest = recetas.slice(0,3);
      latest.forEach(r => {
        const thumb = document.createElement('a');
        thumb.className = 'receta-thumb';
        thumb.href = `/receta/${r.id || ''}`;
        const img = document.createElement('img'); img.src = r.fotoReceta || '/static/placeholder.png'; img.alt = r.nombreReceta || '';
        const t = document.createElement('div'); t.className = 'r-title'; t.textContent = r.nombreReceta || '';
        thumb.appendChild(img); thumb.appendChild(t);
        cont.appendChild(thumb);
      });
      // si no hay recetas, mostrar ayuda
      if (latest.length === 0) {
        cont.innerHTML = '<div class="empty-placeholder text-center text-muted w-100 py-3">No tienes recetas publicadas todavía. <a href="/mis-recetas">Crea tu primera receta</a>.</div>';
      }
    } catch (e) { console.error('Error cargando preview recetas', e); }
  }

  // (Antiguos handlers de modal de cambio de contraseña eliminados — el flujo se centraliza en `#perfilEditModal`)

  // name modal Enter handler
  const modalEl = document.getElementById('cambiarNombreModal');
  const modalInput = document.getElementById('modalInputNombre');
  const modalGuardar = document.getElementById('modalGuardarNombre');
  const modalMensaje = document.getElementById('modalMensajeNombre');
  if (modalInput && modalGuardar) {
    modalInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        modalGuardar.click();
      }
    });
  }

  const modalFotoInput = document.getElementById('modalInputFoto');
  const modalFotoGuardar = document.getElementById('modalGuardarFoto');
  const modalFotoMensaje = document.getElementById('modalMensajeFoto');
  if (modalFotoInput && modalFotoGuardar) {
    modalFotoInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        modalFotoGuardar.click();
      }
    });
  }

  // name change modal submit
  if (modalGuardar) {
    modalGuardar.addEventListener('click', async () => {
      if (modalMensaje) modalMensaje.style.display = 'none';
      if (!modalInput || !modalInput.reportValidity()) return;
      const nuevo = modalInput.value.trim();
      modalGuardar.disabled = true;
      try {
        const res = await fetch('/api/actualizar-usuario', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombreUsuario: nuevo }) });
        const j = await res.json();
        if (!res.ok) {
          if (modalMensaje) { modalMensaje.className = 'alert alert-danger small mt-2'; modalMensaje.textContent = j.mensaje || 'Error al actualizar nombre'; modalMensaje.style.display = 'block'; }
          modalGuardar.disabled = false;
          return;
        }
        const perfilNombreEl = document.getElementById('perfilNombre'); if (perfilNombreEl) perfilNombreEl.textContent = nuevo;
        if (modalMensaje) { modalMensaje.className = 'alert alert-success small mt-2'; modalMensaje.textContent = 'Nombre actualizado correctamente'; modalMensaje.style.display = 'block'; }
        try { if (window.actualizarNavbarUsuario) window.actualizarNavbarUsuario(); } catch (e) { console.error(e); }
        setTimeout(() => { if (modalInstance) modalInstance.hide(); }, 700);
      } catch (err) {
        if (modalMensaje) { modalMensaje.className = 'alert alert-danger small mt-2'; modalMensaje.textContent = 'Error de conexión al actualizar nombre'; modalMensaje.style.display = 'block'; }
      } finally {
        modalGuardar.disabled = false;
      }
    });
  }
}

// Auto-init when module loaded
inicializarPerfilModales();
// Load profile data after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cargarPerfil);
} else {
  cargarPerfil();
}
// Export default for other scripts
export default { cargarPerfil, subirFoto, inicializarPerfilModales };
