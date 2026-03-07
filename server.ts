import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base de datos - Nota: En Firebase App Hosting, SQLite se reiniciará con cada despliegue
const db = new Database("arlie.db");
db.pragma('foreign_keys = ON');

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    birthdate TEXT,
    password_hash TEXT,
    pin TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'inactive'
  );

  CREATE TABLE IF NOT EXISTS access_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_value TEXT UNIQUE,
    user_id INTEGER,
    assigned_at DATETIME,
    expires_at DATETIME,
    status TEXT DEFAULT 'created',
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS key_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_id INTEGER,
    status TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY(key_id) REFERENCES access_keys(id)
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id INTEGER,
    message TEXT,
    role TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    risk_level TEXT DEFAULT 'none',
    resolved INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS availability_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    date TEXT,
    time TEXT,
    type TEXT DEFAULT 'presencial',
    is_booked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    slot_id INTEGER,
    status TEXT DEFAULT 'scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(slot_id) REFERENCES availability_slots(id)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    term TEXT,
    status TEXT DEFAULT 'in_progress',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS diary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    mood TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  INSERT OR IGNORE INTO users (username, first_name, last_name, email, password_hash, status) 
  VALUES ('admin', 'Admin', 'ArlIE', 'admin@arlie.chat', 'admin123', 'active');
`);

// Migration Helper
const addColumnIfMissing = (tableName: string, columnName: string, columnDef: string) => {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
    const exists = tableInfo.some(col => col.name === columnName);
    if (!exists) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
    }
  } catch (e) {
    console.error(`Migration error:`, e);
  }
};

addColumnIfMissing('users', 'status', "TEXT DEFAULT 'inactive'");
addColumnIfMissing('chat_history', 'session_id', 'INTEGER');

async function startServer() {
  const app = express();
  app.use(express.json());

  // Puerto configurado dinámicamente para la nube
  const PORT = process.env.PORT || 8080;

  // --- API Routes ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", port: PORT, env: process.env.NODE_ENV });
  });

  app.post("/api/login", (req, res) => {
    const { identifier, password } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE (email = ? OR username = ?) AND password_hash = ?").get(identifier, identifier, password) as any;
      if (user) res.json({ success: true, user });
      else res.status(401).json({ error: "Credenciales inválidas." });
    } catch (e) { res.status(500).json({ error: "Error interno." }); }
  });

  // (Mantenemos tus otras rutas API de la misma forma...)
  // ... [Tus rutas de registro, chat, citas, etc] ...

  // --- Frontend Handling (Producción vs Desarrollo) ---
  const isProd = process.env.NODE_ENV === "production";
  
  if (isProd) {
    // En producción servimos la carpeta dist
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  } else {
    // En desarrollo usamos Vite
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Vite failed:", e);
    }
  }

  // Escuchando en 0.0.0.0 (Crucial para Cloud Run / Firebase)
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
