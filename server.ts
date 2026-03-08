import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialización de Firebase (Usando el ID de tu proyecto)
initializeApp({ projectId: "arlie-chat" });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// Configuración de Gemini desde la variable que acabas de poner en el panel
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

const app = express();
app.use(express.json());

// --- ENDPOINT DE CHAT (Lógica centralizada) ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message, gender } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Eres ArlIE, un asistente de bienestar emocional para estudiantes (${gender}). Responde de forma empática y breve: ${message}`;
    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error("Error en IA:", error);
    res.status(500).json({ error: "Error de conexión con ArlIE." });
  }
});

// --- ENDPOINT DE CLAVES (ADMIN) ---
app.get("/api/admin/keys", async (req, res) => {
  try {
    const snapshot = await db.collection("keys").orderBy("created_at", "desc").get();
    const now = new Date();
    
    // Cálculo automático de los 3 meses de duración
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

    res.json(keys || []); // Retornar array vacío evita el error 'find' en el Dashboard
  } catch (error) {
    res.status(500).json([]);
  }
});

// --- SERVIR EL FRONTEND ---
const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"));
  }
});

// --- CONFIGURACIÓN DE ESCUCHA CRÍTICA ---
const PORT = process.env.PORT || 8080;
// '0.0.0.0' es indispensable para que Cloud Run acepte tráfico externo
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`>>> Servidor ArlIE funcionando en el puerto ${PORT}`);
});