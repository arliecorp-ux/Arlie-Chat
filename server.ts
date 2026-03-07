import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Inicialización Profesional de Firebase
// En App Hosting, esto se conecta solo a tu proyecto
initializeApp();
const db = getFirestore();

// 2. Función para asegurar que el Admin siempre exista en Firestore
async function ensureAdminUser() {
  const adminEmail = 'admin@arlie.chat';
  const adminRef = db.collection("users").doc(adminEmail);
  const doc = await adminRef.get();

  if (!doc.exists) {
    console.log("Configurando acceso de administrador inicial...");
    await adminRef.set({
      username: 'admin',
      first_name: 'Admin',
      last_name: 'ArlIE',
      email: adminEmail,
      password_hash: 'admin123', // Tu contraseña de acceso
      status: 'active',
      role: 'admin',
      created_at: new Date().toISOString()
    });
    console.log("Administrador creado con éxito en la nube.");
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = process.env.PORT || 8080;

  // Ejecutamos la verificación del admin al arrancar
  await ensureAdminUser();

  // --- RUTAS DE LA API ---

  // Verificación de salud del servidor
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", port: PORT, database: "firestore" });
  });

  // REGISTRO DE USUARIOS (Para Arlette y nuevos miembros)
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, first_name, last_name, username, phone, birthdate } = req.body;
      
      // Guardamos en la colección 'users' usando el email como ID
      await db.collection("users").doc(email).set({
        first_name,
        last_name,
        username,
        email,
        phone,
        birthdate,
        password_hash: password,
        status: "active",
        role: "user",
        created_at: new Date().toISOString()
      });

      res.json({ success: true, message: "Usuario registrado correctamente en Firestore." });
    } catch (error) {
      console.error("Error al registrar:", error);
      res.status(500).json({ error: "Falla en la conexión con la base de datos." });
    }
  });

  // LOGIN (Para entrar a la App)
  app.post("/api/login", async (req, res) => {
    const { identifier, password } = req.body;
    try {
      const usersRef = db.collection("users");
      // Buscamos por email o por nombre de usuario
      const snapshot = await usersRef.where("password_hash", "==", password).get();
      
      const userDoc = snapshot.docs.find(doc => 
        doc.data().email === identifier || doc.data().username === identifier
      );

      if (userDoc) {
        // Devolvemos los datos del usuario para que la pantalla NO se quede negra
        res.json({ success: true, user: userDoc.data() });
      } else {
        res.status(401).json({ error: "Usuario o contraseña incorrectos." });
      }
    } catch (error) {
      console.error("Error en Login:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  });

  // --- MANEJO DEL FRONTEND (Lo que el usuario ve) ---
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

  // Escucha profesional en todas las interfaces (0.0.0.0)
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`ArlIE Chat operativo en el puerto ${PORT}`);
  });
}

startServer();