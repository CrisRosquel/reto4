// main.js

// --- LÓGICA DE USUARIO (AUTH) ---

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Llamada al backend
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        showDashboard();
    } else {
        alert('Error: Usuario o contraseña incorrectos');
    }
});

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) return alert('Por favor, escribe un usuario y contraseña');

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        alert('¡Registrado con éxito! Ahora puedes iniciar sesión.');
    } else {
        alert('Error: El usuario probablemente ya existe.');
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    location.reload(); // Recargar página para volver al login
}

function showDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('nav-actions').classList.remove('hidden');
    loadGames(); // Cargar juegos inmediatamente
}


// --- LÓGICA DE FAVORITOS (LOCALSTORAGE) ---
let currentView = 'favorites'; // Por defecto muestra favoritos al entrar

function getFavorites() {
    // Recupera los IDs guardados o un array vacío si no hay nada
    const favs = localStorage.getItem('game_favorites');
    return favs ? JSON.parse(favs) : [];
}

function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) {
        // Si ya es favorito, lo quitamos
        favs = favs.filter(favId => favId !== id);
    } else {
        // Si no es favorito, lo añadimos
        favs.push(id);
    }
    // Guardamos en LocalStorage
    localStorage.setItem('game_favorites', JSON.stringify(favs));
    loadGames(); // Recargamos la vista
}

function toggleView(view) {
    currentView = view;
    // Cambiar estilos de los botones
    document.getElementById('btn-view-favs').className = view === 'favorites' ? 'btn btn-primary' : 'btn btn-outline-primary';
    document.getElementById('btn-view-all').className = view === 'all' ? 'btn btn-primary' : 'btn btn-outline-primary';
    loadGames();
}

// --- LÓGICA DE JUEGOS (CRUD) ---

async function loadGames() {
    const platform = document.getElementById('filter-platform').value;
    const status = document.getElementById('filter-status').value;
    
    const res = await fetch(`/api/games?platform=${platform}&status=${status}&_t=${Date.now()}`);
    
    if (res.status === 401) return location.reload(); 
    
    let games = await res.json();

    // NUEVO: Filtrar por favoritos si la vista actual lo requiere
    if (currentView === 'favorites') {
        const favs = getFavorites();
        games = games.filter(game => favs.includes(game.id));
    }

    renderGames(games);
}
function renderGames(games) {
    const list = document.getElementById('games-list');
    
    if (games.length === 0) {
        list.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-controller display-1 text-secondary opacity-50"></i>
                <h4 class="text-white mt-3">Sin juegos... todavía</h4>
                <p class="text-dim">¡Dale al botón de añadir!</p>
            </div>`;
        return;
    }

   list.innerHTML = games.map(game => {
        let platClass = 'plat-pc';
        if(game.platform.includes('Play')) platClass = 'plat-ps';
        if(game.platform.includes('Xbox')) platClass = 'plat-xbox';
        if(game.platform.includes('Nin')) platClass = 'plat-nintendo';

        let statusBadge = '';
        if(game.status === 'completado') statusBadge = '<span class="badge-custom bg-success text-white"><i class="bi bi-check-lg"></i> LISTO</span>';
        else if(game.status === 'jugando') statusBadge = '<span class="badge-custom bg-warning text-dark"><i class="bi bi-play-fill"></i> JUGANDO</span>';
        else statusBadge = '<span class="badge-custom bg-secondary text-white"><i class="bi bi-pause-fill"></i> PENDIENTE</span>';

        // NUEVO: Determinar si es favorito para pintar la estrella
        const isFav = getFavorites().includes(game.id);
        const starIcon = isFav ? 'bi-star-fill text-warning' : 'bi-star text-secondary';

        return `
        <div class="col-md-4 col-sm-6">
            <div class="game-card h-100">
                <div class="platform-strip ${platClass}"></div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="badge bg-dark border border-secondary text-light">${game.platform}</span>
                        <div>
                            ${statusBadge}
                            <button class="btn btn-sm btn-link p-0 ms-2" onclick="toggleFavorite(${game.id})">
                                <i class="bi ${starIcon} fs-5" style="text-shadow: 0 0 5px rgba(255,193,7,0.5);"></i>
                            </button>
                        </div>
                    </div>
                    
                    <h4 class="card-title fw-bold text-white mb-1">${game.title}</h4>
                    <p class="card-text text-dim small mb-4">
                        <i class="bi bi-tag-fill me-1"></i> ${game.genre}
                    </p>
                    
                    <div class="d-flex gap-2 mt-auto pt-3 border-top border-secondary border-opacity-25">
                        <button class="btn btn-sm btn-action flex-grow-1" onclick='editGame(${JSON.stringify(game)})'>
                            Editar
                        </button>
                        <button class="btn btn-sm btn-action btn-delete" onclick="deleteGame(${game.id})">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

function getStatusColor(status) {
    if (status === 'completado') return 'success'; // Verde
    if (status === 'jugando') return 'warning';    // Amarillo
    return 'secondary';                            // Gris
}

// --- MODALES Y FORMULARIOS ---

window.prepareModal = (type) => {
    document.getElementById('game-form').reset();
    document.getElementById('game-id').value = ''; // Limpiar ID
    document.getElementById('modalTitle').innerText = 'Nuevo Juego';
};

window.editGame = (game) => {
    // Abrir modal manualmente usando Bootstrap 5
    const modal = new bootstrap.Modal(document.getElementById('gameModal'));
    
    // Rellenar datos
    document.getElementById('game-id').value = game.id;
    document.getElementById('game-title').value = game.title;
    document.getElementById('game-platform').value = game.platform;
    document.getElementById('game-genre').value = game.genre;
    document.getElementById('game-status').value = game.status;
    document.getElementById('modalTitle').innerText = 'Editar Juego';
    
    modal.show();
};

// Guardar (Crear o Editar)
// Guardar (Crear o Editar)
document.getElementById('game-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('game-id').value;
    const data = {
        title: document.getElementById('game-title').value,
        platform: document.getElementById('game-platform').value,
        genre: document.getElementById('game-genre').value,
        status: document.getElementById('game-status').value
    };

    const url = id ? `/api/games/${id}` : '/api/games';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            // 1. Cerrar el modal primero
            const modalEl = document.getElementById('gameModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            // 2. Limpiar el formulario por si acaso
            document.getElementById('game-form').reset();

            // 3. Recargar la lista INMEDIATAMENTE
            await loadGames(); 
        } else {
            alert('Hubo un error al guardar el juego.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

window.deleteGame = async (id) => {
    if (confirm('¿Seguro que quieres eliminar este juego?')) {
        await fetch(`/api/games/${id}`, { method: 'DELETE' });
        loadGames();
    }
};