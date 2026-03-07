import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialización de Firebase
initializeApp();
const db = getFirestore();

// Función para asegurar que el Admin exista
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
      console.log("Admin verificado/creado.");
    }
  } catch (e) {
    console.error("Error al conectar con la DB en el arranque:", e);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 8080;

  // Intentar conectar con la DB antes de recibir visitas
  await ensureAdminUser();

  // RUTA DE REGISTRO
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

      res.json({ success: true, message: "¡Registro exitoso en la nube!" });
    } catch (e) {
      console.error("Error Firestore:", e);
      res.status(500).json({ error: "Error de conexión con Firestore." });
    }
  });

  // RUTA DE LOGIN
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
        res.json({ success: true, user: userDoc.data() });
      } else {
        res.status(401).json({ error: "Credenciales inválidas." });
      }
    } catch (e) {
      res.status(500).json({ error: "Error de servidor." });
    }
  });

  // MANEJO DE FRONTEND
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`ArlIE funcionando en puerto ${PORT}`);
  });
}

startServer();