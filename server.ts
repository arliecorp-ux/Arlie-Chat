import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, credential } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Inicialización Reforzada
// Usamos una configuración que fuerza la detección del proyecto en us-east4
initializeApp({
  projectId: "arlie-chat" 
});

const db = getFirestore();
// Esto es vital para que no falle si algún campo llega vacío desde el celular
db.settings({ ignoreUndefinedProperties: true });

async function ensureAdminUser() {
  try {
    const adminEmail = 'admin@arlie.chat';
    const adminRef = db.collection("users").doc(adminEmail);
    const doc = await adminRef.get();

    if (!doc.exists) {
      await adminRef.set({
        username: 'admin',
        first_name: 'Admin',
        last_name: 'ArlIE',
        email: adminEmail,
        password_hash: 'admin123',
        status: 'active',
        role: 'admin',
        created_at: new Date().toISOString()
      });
      console.log("DATABASE: Admin creado/verificado con éxito.");
    }
  } catch (e) {
    console.error("DATABASE ERROR inicializando:", e);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 8080;

  await ensureAdminUser();

  // RUTA DE REGISTRO - Corregida para evitar el error 500
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, first_name, last_name, username, phone, birthdate } = req.body;
      
      if (!email) {
        return res.status(400).json({ success: false, error: "Falta el correo electrónico." });
      }

      await db.collection("users").doc(email).set({
        first_name: first_name || "",
        last_name: last_name || "",
        username: username || email.split('@')[0],
        email: email,
        phone: phone || "",
        birthdate: birthdate || "",
        password_hash: password,
        status: "active",
        created_at: new Date().toISOString()
      });

      console.log(`USUARIO REGISTRADO: ${email}`);
      return res.json({ success: true });
    } catch (e: any) {
      console.error("FIRESTORE ERROR REGISTRO:", e.message);
      return res.status(500).json({ success: false, error: "Error de conexión con Firestore." });
    }
  });

  // RUTA DE LOGIN - Corregida para evitar pantalla negra (TypeError)
  app.post("/api/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;
      
      const snapshot = await db.collection("users")
        .where("password_hash", "==", password)
        .get();

      const userDoc = snapshot.docs.find(doc => 
        doc.data().email === identifier || doc.data().username === identifier
      );

      if (userDoc) {
        const userData = userDoc.data();
        return res.json({ success: true, user: userData });
      } else {
        return res.status(401).json({ success: false, error: "Credenciales inválidas." });
      }
    } catch (e: any) {
      console.error("FIRESTORE ERROR LOGIN:", e.message);
      // Enviamos un JSON válido siempre para que el frontend no se rompa (pantalla negra)
      return res.status(500).json({ success: false, error: "Error interno del servidor." });
    }
  });

  // MANEJO DE FRONTEND
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`SERVIDOR ArlIE: Activo en puerto ${PORT}`);
  });
}

startServer();