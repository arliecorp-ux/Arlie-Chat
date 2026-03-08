import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initializeApp({ projectId: "arlie-chat" });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 8080;

  // --- LOGIN SEGURO ---
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
        if (userData.status === "activada") return res.json({ success: true, user: userData });
        return res.status(403).json({ success: false, error: "Cuenta inactiva." });
      }
      res.status(401).json({ success: false, error: "Credenciales inválidas." });
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

  // --- CHAT IA (SÓLO SERVIDOR) ---
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, gender } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Eres ArlIE para estudiantes (${gender}). Responde empáticamente: ${message}`;
      const result = await model.generateContent(prompt);
      res.json({ reply: result.response.text() });
    } catch (e) { res.status(500).json({ error: "Error IA" }); }
  });

  const distPath = path.resolve(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(Number(PORT), "0.0.0.0", () => console.log(`>>> Servidor ArlIE OK en ${PORT}`));
}
startServer();