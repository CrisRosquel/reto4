const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../data/database'); 
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
};

// AUTH 
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        stmt.run(username, hashedPassword);
        res.json({ message: 'Usuario creado' });
    } catch (err) {
        res.status(400).json({ error: 'El usuario ya existe' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user.id; 
        res.json({ message: 'Login exitoso' });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout exitoso' });
});


// GET 
router.get('/games', requireAuth, (req, res) => {
    const { platform, genre, status } = req.query;
    let query = 'SELECT * FROM games WHERE user_id = ?';
    const params = [req.session.userId];
    if (platform) { query += ' AND platform = ?'; params.push(platform); }
    if (genre) { query += ' AND genre = ?'; params.push(genre); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    const games = db.prepare(query).all(...params);
    res.json(games);
});

// POST (Crear)
router.post('/games', requireAuth, (req, res) => {
    const { title, platform, genre, status } = req.body;
    const stmt = db.prepare('INSERT INTO games (user_id, title, platform, genre, status) VALUES (?, ?, ?, ?, ?)');
    stmt.run(req.session.userId, title, platform, genre, status);
    res.json({ message: 'Juego añadido' });
});

// PUT (Editar)
router.put('/games/:id', requireAuth, (req, res) => {
    const { title, platform, genre, status } = req.body;
    const { id } = req.params;
    const stmt = db.prepare('UPDATE games SET title = ?, platform = ?, genre = ?, status = ? WHERE id = ? AND user_id = ?');
    const info = stmt.run(title, platform, genre, status, id, req.session.userId);
    if (info.changes > 0) res.json({ message: 'Actualizado' });
    else res.status(404).json({ error: 'No encontrado' });
});

// DELETE (Borrar)
router.delete('/games/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM games WHERE id = ? AND user_id = ?');
    stmt.run(id, req.session.userId);
    res.json({ message: 'Eliminado' });
});

module.exports = router;