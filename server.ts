import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. INICIALIZACIÓN PROFESIONAL
initializeApp({
  projectId: "arlie-chat"
});

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// 2. RUTA DE PRUEBA PARA VER SI EL SERVIDOR RESPONDE
async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 8080;

  // Ruta simple para confirmar que el servidor NO da 404
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Servidor ArlIE conectado correctamente" });
  });

  // REGISTRO DE USUARIOS
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, first_name, last_name, username, phone, birthdate } = req.body;
      
      if (!email) return res.status(400).json({ success: false, error: "Email requerido" });

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

      return res.json({ success: true });
    } catch (e: any) {
      console.error("Error Firestore:", e.message);
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // LOGIN
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
        return res.json({ success: true, user: userDoc.data() });
      } else {
        return res.status(401).json({ success: false, error: "Credenciales inválidas" });
      }
    } catch (e) {
      return res.status(500).json({ success: false, error: "Error de servidor" });
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
    console.log(`ArlIE Online en puerto ${PORT}`);
  });
}

startServer();