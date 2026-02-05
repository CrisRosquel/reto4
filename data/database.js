const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'videogames.db');
const db = new Database(dbPath);
const initDb = () => {
    // Tabla Usuarios
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `).run();

    // Tabla Videojuegos
    db.prepare(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            platform TEXT NOT NULL,
            genre TEXT NOT NULL,
            status TEXT CHECK(status IN ('pendiente', 'jugando', 'completado')) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `).run();
    
    console.log('Base de datos conectada en:', dbPath);
};

initDb();

module.exports = db;