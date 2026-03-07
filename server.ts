import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
`);

// Robust Migration Helper
const addColumnIfMissing = (tableName: string, columnName: string, columnDef: string) => {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
    const exists = tableInfo.some(col => col.name === columnName);
    if (!exists) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
      console.log(`Migration: Added '${columnName}' to '${tableName}' table.`);
    }
  } catch (e) {
    console.error(`Migration error on ${tableName}.${columnName}:`, e);
  }
};

db.exec(`
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
    type TEXT DEFAULT 'presencial', -- presencial, llamada
    is_booked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    slot_id INTEGER,
    status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, cancelled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(slot_id) REFERENCES availability_slots(id)
  );

  CREATE TABLE IF NOT EXISTS appointment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER,
    status TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by INTEGER, -- user_id who made the change
    notes TEXT,
    FOREIGN KEY(appointment_id) REFERENCES appointments(id),
    FOREIGN KEY(changed_by) REFERENCES users(id)
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

  -- Default Admin User
  INSERT OR IGNORE INTO users (username, first_name, last_name, email, password_hash, status) 
  VALUES ('admin', 'Admin', 'ArlIE', 'admin@arlie.chat', 'admin123', 'active');
`);

// Ensure all required columns exist (for existing databases)
addColumnIfMissing('users', 'status', "TEXT DEFAULT 'inactive'");
addColumnIfMissing('access_keys', 'assigned_at', 'DATETIME');
addColumnIfMissing('access_keys', 'expires_at', 'DATETIME');
addColumnIfMissing('chat_history', 'session_id', 'INTEGER');
addColumnIfMissing('chat_history', 'resolved', 'INTEGER DEFAULT 0');

// Helper to log key history
const logKeyHistory = (keyId: number, status: string, notes: string = "") => {
  db.prepare("INSERT INTO key_history (key_id, status, notes) VALUES (?, ?, ?)").run(keyId, status, notes);
};

async function startServer() {
  fs.writeFileSync('server.log', `${new Date().toISOString()} - startServer called\n`);
  const app = express();
  app.use(express.json());
  
  app.use((req, res, next) => {
    fs.appendFileSync('server.log', `${new Date().toISOString()} - Request: ${req.method} ${req.url}\n`);
    next();
  });

  const PORT = 3000;

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      cwd: process.cwd(),
      dirname: __dirname,
      files: fs.readdirSync(__dirname).filter(f => !f.startsWith('.'))
    });
  });

  app.get("/test", (req, res) => res.send("TEST OK"));

  // --- API Routes ---

  // Auth & User Management
  app.post("/api/register", (req, res) => {
    const { firstName, lastName, username: providedUsername, email, phone, birthdate, password } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Todos los campos obligatorios deben ser completados." });
    }

    // Si no viene username, lo generamos (aunque el front ya lo manda)
    const cleanName = firstName.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
    const cleanLastName = lastName.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
    const baseUsername = providedUsername || `${cleanName}_${cleanLastName}`;
    let username = baseUsername;
    
    try {
      // Verificar si el correo ya existe
      const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Este correo electrónico ya está registrado." });
      }

      // Verificar si el usuario ya existe para evitar colisiones
      let attempts = 0;
      while (db.prepare("SELECT id FROM users WHERE username = ?").get(username) && attempts < 20) {
        username = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;
        attempts++;
      }

      if (attempts >= 20) {
        return res.status(500).json({ error: "No se pudo generar un nombre de usuario único. Intenta con otro nombre." });
      }

      const stmt = db.prepare("INSERT INTO users (username, first_name, last_name, email, phone, birthdate, password_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'inactive')");
      const result = stmt.run(username, firstName, lastName, email, phone, birthdate, password);
      
      console.log(`Usuario creado con éxito: ${username} (ID: ${result.lastInsertRowid})`);
      res.json({ success: true, userId: result.lastInsertRowid, username });
    } catch (error: any) {
      console.error("Error en registro:", error.message);
      if (error.message.includes("UNIQUE constraint failed: users.username")) {
        return res.status(400).json({ error: "El nombre de usuario ya existe. Por favor intenta con otro." });
      }
      if (error.message.includes("UNIQUE constraint failed: users.email")) {
        return res.status(400).json({ error: "Este correo electrónico ya está registrado." });
      }
      res.status(400).json({ error: "Error al crear el usuario: " + error.message });
    }
  });

  app.post("/api/login", (req, res) => {
    const { identifier, password } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE (email = ? OR username = ?) AND password_hash = ?").get(identifier, identifier, password) as any;
      if (user) {
        console.log(`Login exitoso para: ${user.username}`);
        res.json({ success: true, user });
      } else {
        res.status(401).json({ error: "Usuario o contraseña incorrectos." });
      }
    } catch (error: any) {
      console.error("Error en login:", error.message);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  });

  app.get("/api/verify-user/:id", (req, res) => {
    try {
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(req.params.id);
      if (user) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get users waiting for keys
  app.get("/api/admin/pending-users", (req, res) => {
    const users = db.prepare("SELECT * FROM users WHERE status = 'inactive'").all();
    res.json(users);
  });

  // Admin: Assign key to user
  app.post("/api/admin/assign-key", (req, res) => {
    const { userId, keyValue } = req.body;
    try {
      const result = db.prepare("INSERT INTO access_keys (key_value, user_id, status, assigned_at) VALUES (?, ?, 'assigned', datetime('now'))").run(keyValue, userId);
      logKeyHistory(Number(result.lastInsertRowid), 'assigned', `Asignada al usuario ID: ${userId}`);
      res.json({ success: true, keyId: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Update key status (sent_whatsapp, etc)
  app.post("/api/admin/update-key-status", (req, res) => {
    const { keyId, status } = req.body;
    db.prepare("UPDATE access_keys SET status = ? WHERE id = ?").run(status, keyId);
    logKeyHistory(keyId, status);
    res.json({ success: true });
  });

  // User: Verify and Activate Key
  app.post("/api/verify-key", (req, res) => {
    const { key, userId } = req.body;
    const accessKey = db.prepare("SELECT * FROM access_keys WHERE key_value = ? AND user_id = ? AND status IN ('assigned', 'sent_email', 'sent_whatsapp')").get(key, userId);
    
    if (accessKey) {
      // Activate Key
      db.prepare("UPDATE access_keys SET status = 'active', expires_at = datetime('now', '+3 months') WHERE id = ?").run(accessKey.id);
      // Activate User
      db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(userId);
      logKeyHistory(accessKey.id, 'active', 'Clave activada por el usuario');
      res.json({ success: true });
    } else {
      res.status(403).json({ error: "Clave inválida o no asignada a este usuario" });
    }
  });

  // Admin: Get Key History
  app.get("/api/admin/key-history/:keyId", (req, res) => {
    const history = db.prepare("SELECT * FROM key_history WHERE key_id = ? ORDER BY changed_at DESC").all(req.params.keyId);
    res.json(history);
  });

  // Chat History
  app.get("/api/chat-sessions/:userId", (req, res) => {
    const sessions = db.prepare("SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
    res.json(sessions);
  });

  app.post("/api/chat-sessions", (req, res) => {
    const { userId, title } = req.body;
    console.log(`[DEBUG] Creating session for userId: ${userId} (${typeof userId})`);
    
    if (!userId) {
      console.error("[DEBUG] userId is missing in request body");
      return res.status(400).json({ error: "userId is required" });
    }
    
    try {
      // Verify user exists before inserting to avoid foreign key error
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
      if (!user) {
        console.error(`[DEBUG] User with ID ${userId} not found in database.`);
        return res.status(400).json({ error: "User not found" });
      }

      const result = db.prepare("INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)").run(userId, title || 'Nueva Conversación');
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      console.error("[DEBUG] Error creating chat session:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/chat-sessions/:id", (req, res) => {
    const { title } = req.body;
    const { id } = req.params;
    try {
      db.prepare("UPDATE chat_sessions SET title = ? WHERE id = ?").run(title, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/chat/:userId/:sessionId?", (req, res) => {
    const { userId, sessionId } = req.params;
    let history;
    if (sessionId) {
      history = db.prepare("SELECT * FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY timestamp ASC").all(userId, sessionId);
    } else {
      // Get latest session history if no sessionId provided
      const latestSession = db.prepare("SELECT id FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(userId) as any;
      if (latestSession) {
        history = db.prepare("SELECT * FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY timestamp ASC").all(userId, latestSession.id);
      } else {
        // Check for legacy messages without session_id
        history = db.prepare("SELECT * FROM chat_history WHERE user_id = ? AND session_id IS NULL ORDER BY timestamp ASC").all(userId);
      }
    }
    res.json(history);
  });

  app.post("/api/chat", (req, res) => {
    const { userId, user_id, message, role, riskLevel, risk_level, sessionId, session_id } = req.body;
    const finalUserId = userId || user_id;
    const finalRiskLevel = riskLevel || risk_level || 'none';
    const finalSessionId = sessionId || session_id;
    
    if (!finalUserId || !finalSessionId) {
      return res.status(400).json({ error: "userId and sessionId are required" });
    }

    try {
      db.prepare("INSERT INTO chat_history (user_id, session_id, message, role, risk_level) VALUES (?, ?, ?, ?, ?)").run(finalUserId, finalSessionId, message, role, finalRiskLevel);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving chat message:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all users with their latest key status
  app.get("/api/admin/users-detailed", (req, res) => {
    try {
      const users = db.prepare(`
        SELECT 
          u.*, 
          ak.key_value, 
          ak.status as key_status, 
          ak.expires_at,
          ak.id as key_id
        FROM users u
        LEFT JOIN (
          SELECT * FROM access_keys WHERE id IN (SELECT MAX(id) FROM access_keys GROUP BY user_id)
        ) ak ON u.id = ak.user_id
        WHERE u.username != 'admin'
        ORDER BY u.created_at DESC
      `).all();
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching detailed users:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get history for a specific user
  app.get("/api/admin/user-history/:userId", (req, res) => {
    try {
      const history = db.prepare(`
        SELECT kh.*, ak.key_value 
        FROM key_history kh
        JOIN access_keys ak ON kh.key_id = ak.id
        WHERE ak.user_id = ?
        ORDER BY kh.changed_at DESC
      `).all(req.params.userId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/alerts", (req, res) => {
    const alerts = db.prepare(`
      SELECT ch.*, u.first_name, u.last_name 
      FROM chat_history ch 
      JOIN users u ON ch.user_id = u.id 
      WHERE ch.risk_level != 'none' AND (ch.resolved IS NULL OR ch.resolved = 0)
      ORDER BY ch.timestamp DESC
    `).all();
    res.json(alerts);
  });

  app.post("/api/admin/resolve-alert", (req, res) => {
    const { alertId } = req.body;
    try {
      db.prepare("UPDATE chat_history SET resolved = 1 WHERE id = ?").run(alertId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to log appointment history
  const logAppointmentHistory = (appointmentId: number, status: string, userId: number, notes: string = "") => {
    db.prepare("INSERT INTO appointment_history (appointment_id, status, changed_by, notes) VALUES (?, ?, ?, ?)").run(appointmentId, status, userId, notes);
  };

  // --- Availability & Appointments ---
  app.get("/api/availability", (req, res) => {
    try {
      const slots = db.prepare("SELECT * FROM availability_slots WHERE is_booked = 0 AND date >= date('now') ORDER BY date ASC, time ASC").all();
      res.json(slots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/availability", (req, res) => {
    const { adminId, date, time, type } = req.body;
    try {
      db.prepare("INSERT INTO availability_slots (admin_id, date, time, type) VALUES (?, ?, ?, ?)").run(adminId, date, time, type || 'presencial');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/availability/summary", (req, res) => {
    try {
      const summary = db.prepare(`
        SELECT 
          date,
          COUNT(*) as total,
          SUM(is_booked) as booked
        FROM availability_slots
        WHERE date >= date('now')
        GROUP BY date
      `).all();
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/availability/:id", (req, res) => {
    try {
      const slot = db.prepare("SELECT is_booked FROM availability_slots WHERE id = ?").get(req.params.id) as any;
      if (slot?.is_booked) {
        return res.status(400).json({ error: "No se puede eliminar un espacio ya reservado." });
      }
      db.prepare("DELETE FROM availability_slots WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/appointments", (req, res) => {
    const { userId, slotId } = req.body;
    try {
      const slot = db.prepare("SELECT is_booked FROM availability_slots WHERE id = ?").get(slotId) as any;
      if (slot?.is_booked) {
        return res.status(400).json({ error: "Este espacio ya ha sido reservado." });
      }

      const transaction = db.transaction(() => {
        db.prepare("UPDATE availability_slots SET is_booked = 1 WHERE id = ?").run(slotId);
        const result = db.prepare("INSERT INTO appointments (user_id, slot_id, status) VALUES (?, ?, 'scheduled')").run(userId, slotId);
        logAppointmentHistory(Number(result.lastInsertRowid), 'scheduled', userId, 'Cita agendada por el usuario');
      });
      transaction();

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/appointments/:userId", (req, res) => {
    try {
      const appointments = db.prepare(`
        SELECT a.*, s.date, s.time, s.type
        FROM appointments a
        JOIN availability_slots s ON a.slot_id = s.id
        WHERE a.user_id = ?
        ORDER BY s.date DESC, s.time DESC
      `).all(req.params.userId);
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/appointments/:id/status", (req, res) => {
    const { status, userId } = req.body; // userId of the person making the change
    try {
      const appointment = db.prepare("SELECT slot_id FROM appointments WHERE id = ?").get(req.params.id) as any;
      
      const transaction = db.transaction(() => {
        db.prepare("UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, req.params.id);
        logAppointmentHistory(Number(req.params.id), status, userId || 0, `Estado actualizado a ${status}`);
        
        if (status === 'cancelled') {
          db.prepare("UPDATE availability_slots SET is_booked = 0 WHERE id = ?").run(appointment.slot_id);
        }
      });
      transaction();
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/appointments-detailed", (req, res) => {
    try {
      const appointments = db.prepare(`
        SELECT a.*, s.date, s.time, s.type, u.first_name, u.last_name, u.username, u.email
        FROM appointments a
        JOIN availability_slots s ON a.slot_id = s.id
        JOIN users u ON a.user_id = u.id
        ORDER BY s.date DESC, s.time DESC
      `).all();
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/availability-all", (req, res) => {
    try {
      const slots = db.prepare("SELECT * FROM availability_slots ORDER BY date DESC, time DESC").all();
      res.json(slots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/generate-key", (req, res) => {
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    try {
      db.prepare("INSERT INTO access_keys (key_value, expires_at, status) VALUES (?, datetime('now', '+1 year'), 'created')").run(key);
      res.json({ key });
    } catch (error: any) {
      console.error("Error generating key:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Diary Routes ---
  app.get("/api/diary/:userId", (req, res) => {
    try {
      const entries = db.prepare("SELECT * FROM diary_entries WHERE user_id = ? ORDER BY timestamp DESC").all(req.params.userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/diary", (req, res) => {
    const { userId, content, mood } = req.body;
    try {
      db.prepare("INSERT INTO diary_entries (user_id, content, mood) VALUES (?, ?, ?)").run(userId, content, mood);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Goals Routes ---
  app.get("/api/goals/:userId", (req, res) => {
    try {
      const goals = db.prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
      res.json(goals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/goals", (req, res) => {
    const { userId, title, description, term } = req.body;
    try {
      db.prepare("INSERT INTO goals (user_id, title, description, term) VALUES (?, ?, ?, ?)").run(userId, title, description, term);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/goals/:id", (req, res) => {
    const { status } = req.body;
    try {
      db.prepare("UPDATE goals SET status = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/goals/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM goals WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Frontend Handling ---
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.join(__dirname, "dist");

  if (fs.existsSync(distPath) && (isProd || !fs.existsSync(path.join(__dirname, "src")))) {
    // Production mode: serve from dist
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Development mode: use Vite
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      
      app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        if (url.startsWith('/api')) return next();
        
        try {
          const indexPath = path.resolve(__dirname, 'index.html');
          if (!fs.existsSync(indexPath)) {
            return res.status(404).send("index.html not found in root. Please ensure you are in the correct directory.");
          }
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } catch (e) {
      console.error("Failed to start Vite server:", e);
      // Fallback to serving index.html directly if Vite fails
      app.get("*", (req, res, next) => {
        if (req.originalUrl.startsWith("/api")) return next();
        res.sendFile(path.join(__dirname, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    fs.appendFileSync('server.log', `${new Date().toISOString()} - Server listening on port ${PORT}\n`);
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
