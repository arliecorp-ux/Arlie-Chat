import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialización con el ID de tu proyecto
initializeApp({ projectId: "arlie-chat" });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 8080;

  // RUTA DE CHAT (Para que ArlIE responda)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(message);
      res.json({ reply: result.response.text() });
    } catch (e) {
      res.status(500).json({ error: "Error de IA" });
    }
  });

  // RUTA DE REGISTRO (Captura todos los campos correctamente)
  app.post("/api/register", async (req, res) => {
    try {
      const d = req.body;
      const userData = {
        first_name: d.firstName || d.first_name || "",
        last_name: d.lastName || d.last_name || "",
        email: d.email || "",
        password_hash: d.password || "",
        role: "user",
        created_at: new Date().toISOString()
      };
      await db.collection("users").doc(userData.email).set(userData);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // RUTA PARA EL ADMIN (Evita que los botones salgan negros)
  app.get("/api/users", async (req, res) => {
    try {
      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map(doc => doc.data());
      res.json(users);
    } catch (e) {
      res.status(500).json({ error: "No se pudieron cargar usuarios" });
    }
  });

  // ENTREGA DEL DISEÑO (Frontend)
  const distPath = path.resolve(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(Number(PORT), "0.0.0.0", () => console.log("ArlIE Arriba"));
}
startServer();