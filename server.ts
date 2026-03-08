import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialización de Firebase
initializeApp({ projectId: "arlie-chat" });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// La API Key se lee de las variables que ya configuraste
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

async function startServer() {
  const app = express();
  app.use(express.json());
  
  // CORRECCIÓN PARA CLOUD RUN: Puerto dinámico y host 0.0.0.0
  const PORT = process.env.PORT || 8080;

  // --- RUTA DE CHAT ---
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, gender } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Eres ArlIE para estudiantes (${gender}). Responde empáticamente: ${message}`;
      const result = await model.generateContent(prompt);
      res.json({ reply: result.response.text() });
    } catch (e) {
      res.status(500).json({ error: "Error de IA" });
    }
  });

  // --- GESTIÓN DE USUARIOS ---
  app.get("/api/admin/users", async (req, res) => {
    try {
      const { status } = req.query;
      let query: any = db.collection("users");
      if (status && status !== 'todos') query = query.where("status", "==", status);
      const snapshot = await query.orderBy("created_at", "desc").get();
      res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // --- GESTIÓN DE CLAVES (3 MESES) ---
  app.get("/api/admin/keys", async (req, res) => {
    try {
      const snapshot = await db.collection("keys").orderBy("created_at", "desc").get();
      const now = new Date();
      const keys = snapshot.docs.map(doc => {
        const data = doc.data();
        let daysLeft = null;
        if (data.status === 'activada' && data.activated_at) {
          const expireDate = new Date(data.activated_at);
          expireDate.setMonth(expireDate.getMonth() + 3);
          daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
        return { id: doc.id, ...data, daysLeft };
      });
      res.json(keys);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Servir Frontend
  const distPath = path.resolve(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) res.sendFile(path.join(distPath, "index.html"));
  });

  // ESCUCHAR EN 0.0.0.0 ES OBLIGATORIO
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Servidor ArlIE activo en puerto ${PORT}`);
  });
}
startServer();