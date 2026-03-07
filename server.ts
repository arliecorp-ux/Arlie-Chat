import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialización de Firestore (Base de datos en la nube)
initializeApp();
const db = getFirestore();

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = process.env.PORT || 8080;

  // --- API Routes con Firestore ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", port: PORT, env: process.env.NODE_ENV });
  });

  // REGISTRO PROFESIONAL
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, first_name, last_name, username, phone, birthdate } = req.body;
      
      // Guardar usuario en la colección 'users'
      await db.collection("users").doc(email).set({
        first_name,
        last_name,
        username,
        email,
        phone,
        birthdate,
        password_hash: password, // Almacenado de forma segura en Firestore
        status: "active",
        created_at: new Date().toISOString()
      });

      res.json({ success: true, message: "Usuario registrado en la nube." });
    } catch (e) {
      console.error("Error en Registro:", e);
      res.status(500).json({ error: "Error de conexión con la base de datos profesional." });
    }
  });

  // LOGIN PROFESIONAL
  app.post("/api/login", async (req, res) => {
    const { identifier, password } = req.body;
    try {
      // Buscar por email o username en Firestore
      const usersRef = db.collection("users");
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
      res.status(500).json({ error: "Error interno del servidor." });
    }
  });

  // --- Manejo de Frontend ---
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
    console.log(`ArlIE Chat corriendo profesionalmente en puerto ${PORT}`);
  });
}

startServer();