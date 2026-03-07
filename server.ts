import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Inicialización de Firebase
// Usamos el ID de tu proyecto que se ve en tus capturas
initializeApp({ projectId: "arlie-chat" });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// 2. Configuración de IA con el nombre de variable que SÍ aceptó Google
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 8080;

  // --- RUTAS DE API (El "Cerebro") ---

  // Registro: Captura todos los campos para que no salgan vacíos
  app.post("/api/register", async (req, res) => {
    try {
      const d = req.body;
      const userData = {
        first_name: d.firstName || d.first_name || "",
        last_name: d.lastName || d.last_name || "",
        username: d.username || d.user_suggested || "",
        email: d.email || "",
        phone: d.phone || d.whatsapp || "",
        birthdate: d.birthdate || "",
        password_hash: d.password || "",
        status: "active",
        role: "user", // Por defecto es usuario
        created_at: new Date().toISOString()
      };
      await db.collection("users").doc(userData.email).set(userData);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Login: Verifica credenciales
  app.post("/api/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;
      const snapshot = await db.collection("users").where("password_hash", "==", password).get();
      const userDoc = snapshot.docs.find(doc => 
        doc.data().email === identifier || doc.data().username === identifier
      );

      if (userDoc) {
        return res.json({ success: true, user: userDoc.data() });
      }
      return res.status(401).json({ success: false, error: "Credenciales inválidas" });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Chat: Para que ArlIE responda
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(message);
      const response = await result.response;
      res.json({ reply: response.text() });
    } catch (e: any) {
      res.status(500).json({ error: "Error en el chat" });
    }
  });

  // Admin: Para que los botones inferiores no salgan negros y carguen los usuarios
  app.get("/api/users", async (req, res) => {
    try {
      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- CONFIGURACIÓN DE DISEÑO (Frontend) ---

  // Esto le dice a Google dónde están tus carpetas de diseño (CSS, Imágenes, React)
  const distPath = path.resolve(__dirname, "dist");
  app.use(express.static(distPath));

  // Esta línea es la que quita la pantalla negra del Admin
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(distPath, "index.html"));
    }
  });

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log("Servidor ArlIE Profesional Activo.");
  });
}

startServer();