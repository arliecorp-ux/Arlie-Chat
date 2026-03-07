import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. INICIALIZACIÓN METÓDICA
// Forzamos el ID del proyecto para asegurar la conexión con Firestore en us-east4
initializeApp({
  projectId: "arlie-chat"
});

const db = getFirestore();
// Evita errores 500 si algún campo (como WhatsApp) llega como 'undefined'
db.settings({ ignoreUndefinedProperties: true });

/**
 * Asegura que el usuario Admin exista para que siempre haya alguien con quien probar
 */
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
      console.log("LOG: Usuario administrador verificado en Firestore.");
    }
  } catch (e) {
    console.error("LOG ERROR: Fallo al conectar con la base de datos al inicio:", e);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 8080;

  // Ejecutamos la verificación de DB antes de abrir el servidor
  await ensureAdminUser();

  // --- RUTAS DE API CON MANEJO DE ERRORES ---

  // RUTA DE REGISTRO
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, first_name, last_name, username, phone, birthdate } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Faltan campos obligatorios." });
      }

      // Guardado seguro en la colección 'users'
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
      console.error("FIRESTORE REGISTER ERROR:", e.message);
      // Enviamos JSON para que el frontend no de error de conexión
      return res.status(500).json({ success: false, error: "Error de base de datos. Verifique permisos IAM." });
    }
  });

  // RUTA DE LOGIN
  app.post("/api/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;
      
      // Búsqueda por contraseña y luego filtro por usuario/email
      const snapshot = await db.collection("users")
        .where("password_hash", "==", password)
        .get();

      const userDoc = snapshot.docs.find(doc => 
        doc.data().email === identifier || doc.data().username === identifier
      );

      if (userDoc) {
        return res.json({ success: true, user: userDoc.data() });
      } else {
        return res.status(401).json({ success: false, error: "Credenciales inválidas." });
      }
    } catch (e: any) {
      console.error("FIRESTORE LOGIN ERROR:", e.message);
      // Garantizamos respuesta JSON para evitar la pantalla negra por TypeError
      return res.status(500).json({ success: false, error: "Error de servidor al validar usuario." });
    }
  });

  // --- INTEGRACIÓN CON EL FRONTEND ---
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
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`ArlIE Server operativo en puerto ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("FALLO CRÍTICO EN ARRANQUE:", err);
});