// public/javascripts/main.js

// --- UTILIDADES UX (NUEVO) ---

// Función para mostrar notificaciones elegantes en vez de alert()
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = toastEl.querySelector('.toast-body');
    const toastIcon = document.getElementById('toast-icon');
    
    toastBody.textContent = message;
    
    // Configurar colores e iconos según el tipo
    if (type === 'success') {
        toastEl.classList.remove('bg-danger', 'text-white');
        toastEl.classList.add('bg-success', 'text-white', 'bg-opacity-75');
        toastIcon.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
    } else if (type === 'error') {
        toastEl.classList.remove('bg-success', 'text-white', 'bg-opacity-75');
        toastEl.classList.add('bg-danger', 'text-white');
        toastIcon.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
    }

    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}

// Funciones para el spinner de carga
function toggleLoading(isLoading) {
    const spinner = document.getElementById('loading-spinner');
    const list = document.getElementById('games-list');
    if (isLoading) {
        spinner.classList.remove('hidden');
        list.classList.add('hidden');
    } else {
        spinner.classList.add('hidden');
        list.classList.remove('hidden');
    }
}


// --- LÓGICA DE USUARIO (AUTH) ---

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Deshabilitar botón para evitar doble envío
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            showToast(`¡Bienvenido de nuevo, ${username}!`, 'success');
            showDashboard(username);
        } else {
            showToast('Usuario o contraseña incorrectos', 'error');
            btn.disabled = false; btn.innerHTML = 'INICIAR SESIÓN <i class="bi bi-arrow-right-short ms-1"></i>';
        }
    } catch (error) {
        showToast('Error de conexión con el servidor', 'error');
        btn.disabled = false;
    }
});

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) return showToast('Rellena usuario y contraseña', 'error');

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            showToast('¡Cuenta creada! Ahora inicia sesión.', 'success');
            document.getElementById('auth-form').reset();
        } else {
            showToast('El nombre de usuario ya existe.', 'error');
        }
    } catch (error) {
        showToast('Error al intentar registrarse.', 'error');
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
}

function showDashboard(username) {
    document.getElementById('user-display').innerText = `Jugador: ${username}`;
    // Animación de salida suave del login
    const authSection = document.getElementById('auth-section');
    authSection.style.opacity = '0';
    authSection.style.transform = 'translateY(-20px)';
    authSection.style.transition = 'all 0.5s ease';

    setTimeout(() => {
        authSection.classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        document.getElementById('nav-actions').classList.remove('hidden');
        loadGames();
    }, 500);
}


// --- LÓGICA DE FAVORITOS (LocalStorage) ---

// Iniciar siempre viendo solo favoritos 
let showOnlyFavorites = true; 

function getFavorites() {
    // Lee el LocalStorage o devuelve un array vacío si no hay nada 
    return JSON.parse(localStorage.getItem('favGames') || '[]');
}

function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) {
        favs = favs.filter(favId => favId !== id); // Quitar
        showToast('Eliminado de favoritos', 'success');
    } else {
        favs.push(id); // Añadir
        showToast('¡Añadido a favoritos! ⭐', 'success');
    }
    localStorage.setItem('favGames', JSON.stringify(favs)); // Guardar en LocalStorage 
    loadGames(); // Recargar lista
}

function toggleViewMode() {
    showOnlyFavorites = !showOnlyFavorites;
    const btn = document.getElementById('btn-toggle-favs');
    
    // Cambiar apariencia del botón 
    if (showOnlyFavorites) {
        btn.innerHTML = '<i class="bi bi-star-fill me-1"></i> Viendo: Favoritos';
        btn.className = 'btn btn-warning btn-sm rounded-pill px-3 me-3 fw-bold';
    } else {
        btn.innerHTML = '<i class="bi bi-collection-fill me-1"></i> Viendo: Todos';
        btn.className = 'btn btn-outline-light btn-sm rounded-pill px-3 me-3 fw-bold';
    }
    loadGames();
}


// --- LÓGICA DE JUEGOS (CRUD) ---

async function loadGames() {
    toggleLoading(true);
    const platform = document.getElementById('filter-platform').value;
    const status = document.getElementById('filter-status').value;
    
    try {
        const res = await fetch(`/api/games?platform=${platform}&status=${status}&_t=${Date.now()}`);
        if (res.status === 401) return location.reload();
        let games = await res.json();

        // Filtrar por favoritos si el modo está activado 
        if (showOnlyFavorites) {
            const favs = getFavorites();
            games = games.filter(g => favs.includes(g.id));
        }

        renderGames(games);
    } catch (error) {
        showToast('Error al cargar los juegos', 'error');
    } finally {
        toggleLoading(false);
    }
}

function renderGames(games) {
    const list = document.getElementById('games-list');
    
    if (games.length === 0) {
        let msg = showOnlyFavorites ? "No tienes juegos favoritos aún ⭐" : "Tu colección está vacía 🎮";
        list.innerHTML = `
            <div class="col-12 text-center py-5 animate-in">
                <h4 class="text-white fw-bold">${msg}</h4>
                <p class="text-dim mb-4">Añade juegos o búscalo en la pestaña de 'Todos'.</p>
            </div>`;
        return;
    }

    const favs = getFavorites();

    list.innerHTML = games.map((game, index) => {
        let platClass = 'plat-pc';
        let platIcon = 'bi-pc-display';
        if(game.platform.includes('Play')) { platClass = 'plat-ps'; platIcon = 'bi-playstation'; }
        if(game.platform.includes('Xbox')) { platClass = 'plat-xbox'; platIcon = 'bi-xbox'; }
        if(game.platform.includes('Nin')) { platClass = 'plat-nintendo'; platIcon = 'bi-nintendo-switch'; }

        let statusBadge = '';
        if(game.status === 'completado') statusBadge = '<span class="badge-custom bg-success bg-opacity-75 text-white"><i class="bi bi-trophy-fill me-1"></i>Completado</span>';
        else if(game.status === 'jugando') statusBadge = '<span class="badge-custom bg-warning bg-opacity-75 text-dark"><i class="bi bi-controller me-1"></i>Jugando</span>';
        else statusBadge = '<span class="badge-custom bg-secondary bg-opacity-50 text-white"><i class="bi bi-hourglass-split me-1"></i>Pendiente</span>';

        // Comprobar si el juego actual es favorito
        const isFav = favs.includes(game.id);
        const starClass = isFav ? 'bi-star-fill text-warning' : 'bi-star text-secondary';

        return `
        <div class="col-md-4 col-sm-6 animate-in" style="animation-delay: ${index * 0.1}s">
            <div class="game-card h-100 d-flex flex-column">
                <div class="platform-strip ${platClass}"></div>
                <div class="card-body p-4 d-flex flex-column flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="badge bg-dark bg-opacity-50 border border-secondary text-dim d-flex align-items-center">
                            <i class="bi ${platIcon} me-2"></i>${game.platform}
                        </span>
                        ${statusBadge}
                    </div>
                    
                    <h4 class="card-title fw-bold text-white mb-1 text-truncate">${game.title}</h4>
                    <p class="card-text text-dim small mb-4">
                        <i class="bi bi-tags-fill me-2 text-accent"></i>${game.genre}
                    </p>
                    
                    <div class="d-flex gap-2 mt-auto pt-3 border-top border-light border-opacity-10">
                        <button class="btn btn-sm btn-action px-3" onclick="toggleFavorite(${game.id})" title="Favorito">
                            <i class="bi ${starClass} fs-5"></i>
                        </button>
                        
                        <button class="btn btn-sm btn-action flex-grow-1 py-2 fw-semibold" onclick='editGame(${JSON.stringify(game)})'>
                            <i class="bi bi-pencil-square me-2"></i>Editar
                        </button>
                        <button class="btn btn-sm btn-action btn-delete px-3" onclick="deleteGame(${game.id})" title="Borrar">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

// --- MODALES Y ACCIONES ---

window.prepareModal = (type) => {
    document.getElementById('game-form').reset();
    document.getElementById('game-id').value = '';
    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-plus-circle-fill text-neon me-2"></i>Añadir Nuevo Juego';
};

window.editGame = (game) => {
    const modal = new bootstrap.Modal(document.getElementById('gameModal'));
    document.getElementById('game-id').value = game.id;
    document.getElementById('game-title').value = game.title;
    document.getElementById('game-platform').value = game.platform;
    document.getElementById('game-genre').value = game.genre;
    document.getElementById('game-status').value = game.status;
    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-pencil-square text-warning me-2"></i>Editar Juego';
    modal.show();
};

// Guardar con feedback de Toast
document.getElementById('game-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    
    const id = document.getElementById('game-id').value;
    const data = {
        title: document.getElementById('game-title').value,
        platform: document.getElementById('game-platform').value,
        genre: document.getElementById('game-genre').value,
        status: document.getElementById('game-status').value
    };

    try {
        const res = await fetch(id ? `/api/games/${id}` : '/api/games', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('gameModal'));
            modal.hide();
            document.getElementById('game-form').reset();
            showToast(id ? 'Juego actualizado correctamente' : '¡Juego añadido a la colección!', 'success');
            await loadGames();
        } else {
            throw new Error();
        }
    } catch (error) {
        showToast('Error al guardar el juego', 'error');
    } finally {
        btn.disabled = false; btn.innerHTML = originalText;
    }
});

// Borrar con confirmación más bonita (usando el propio Toast de error como prompt rápido)
window.deleteGame = async (id) => {
    // Para un proyecto real usaríamos un modal de confirmación, pero para no complicar más, usamos un confirm nativo por ahora.
    if (confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
        try {
            const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Juego eliminado', 'success');
                loadGames();
            } else { throw new Error(); }
        } catch (error) {
            showToast('No se pudo eliminar el juego', 'error');
        }
    }
};