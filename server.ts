import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialización profesional de Firestore
initializeApp();
const db = getFirestore();

// FUNCIÓN PARA ASEGURAR QUE EL ADMIN EXISTA
async function ensureAdminUser() {
  const adminEmail = 'admin@arlie.chat';
  const adminRef = db.collection("users").doc(adminEmail);
  const doc = await adminRef.get();

  if (!doc.exists) {
    console.log("Creando usuario administrador por defecto...");
    await adminRef.set({
      username: 'admin',
      first_name: 'Admin',
      last_name: 'ArlIE',
      email: adminEmail,
      password_hash: 'admin123', // Tu clave de acceso
      status: 'active',
      created_at: new Date().toISOString()
    });
    console.log("Usuario admin creado con éxito.");
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = process.env.PORT || 8080;

  // Ejecutar la creación del admin al arrancar
  await ensureAdminUser();

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", port: PORT, env: process.env.NODE_ENV });
  });

  // REGISTRO
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, first_name, last_name, username, phone, birthdate } = req.body;
      await db.collection("users").doc(email).set({
        first_name,
        last_name,
        username,
        email,
        phone,
        birthdate,
        password_hash: password,
        status: "active",
        created_at: new Date().toISOString()
      });
      res.json({ success: true, message: "Usuario registrado en la nube." });
    } catch (e) {
      res.status(500).json({ error: "Error de conexión con Firestore." });
    }
  });

  // LOGIN
  app.post("/api/login", async (req, res) => {
    const { identifier, password } = req.body;
    try {
      const usersRef = db.collection("users");
      // Buscamos por email o username
      let snapshot = await usersRef.where("email", "==", identifier).where("password_hash", "==", password).get();
      if (snapshot.empty) {
        snapshot = await usersRef.where("username", "==", identifier).where("password_hash", "==", password).get();
      }

      if (!snapshot.empty) {
        const user = snapshot.docs[0].data();
        res.json({ success: true, user });
      } else {
        res.status(401).json({ error: "Credenciales inválidas." });
      }
    } catch (e) {
      res.status(500).json({ error: "Error interno." });
    }
  });

  // --- Manejo de Frontend (Producción vs Desarrollo) ---
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  } else {
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

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`ArlIE Chat operativo en puerto ${PORT}`);
  });
}

startServer();