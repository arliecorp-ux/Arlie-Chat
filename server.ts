import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. DIAGNÓSTICO DE INICIO
console.log(">>> [INICIO] Arrancando servidor de diagnóstico ArlIE...");

// Evitar doble inicialización de Firebase
if (!getApps().length) {
    initializeApp({ projectId: "arlie-chat" });
}
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

const app = express();
app.use(express.json());

// --- RUTA DE PRUEBA (HOLA MUNDO) ---
// Si entras a tu-url.com/api/test y ves este JSON, el servidor SI SIRVE.
app.get("/api/test", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "¡HOLA MUNDO! El servidor ArlIE está vivo.",
    env_check: {
      has_api_key: !!process.env.AI_API_KEY,
      port: process.env.PORT || 8080
    }
  });
});

// --- LOGIN CON REPORTE DE ERRORES ---
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log(`>>> [LOGIN] Intentando entrar con: ${identifier}`);
    
    const snapshot = await db.collection("users").where("password_hash", "==", password).get();
    
    if (snapshot.empty) {
        console.log(">>> [ERROR] No se encontró ningún usuario con esa contraseña.");
        return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const userDoc = snapshot.docs.find(doc => 
        doc.data().email === identifier || doc.data().username === identifier
    );

    if (userDoc) {
      return res.json({ success: true, user: userDoc.data() });
    }
    
    res.status(401).json({ error: "Usuario no encontrado." });
  } catch (e: any) {
    console.error(">>> [CRÍTICO] Error en Login:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// --- CHAT CON REPORTE DE ERRORES ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!process.env.AI_API_KEY) throw new Error("Falta la AI_API_KEY en las variables de entorno.");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
    res.json({ reply: result.response.text() });
  } catch (e: any) {
    console.error(">>> [CRÍTICO] Error en Chat:", e.message);
    res.status(500).json({ error: `Error IA: ${e.message}` });
  }
});

// --- SERVIR FRONTEND ---
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  // Si no es una ruta de API, sirve el index.html
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
            res.status(500).send("<h1>ERROR: Carpeta 'dist' no encontrada</h1><p>Asegúrate de ejecutar npm run build antes de subir.</p>");
        }
    });
  }
});

// --- PUERTO CRÍTICO PARA CLOUD RUN ---
const PORT = process.env.PORT || 8080;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`
  ******************************************
  ARLIE SERVER LOGS:
  PUERTO: ${PORT}
  HOST: 0.0.0.0
  STATUS: LISTO PARA PRUEBAS
  ******************************************
  `);
});