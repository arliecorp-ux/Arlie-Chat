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

  // --- REGISTRO Y LOGIN ---

  app.post("/api/register", async (req, res) => {
    try {
      const { first_name, last_name, email, phone, gender, username } = req.body;
      const userData = {
        first_name, last_name, username, email, phone, gender,
        status: "pendiente",
        created_at: new Date().toISOString()
      };
      await db.collection("users").doc(email).set(userData);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;
      const snapshot = await db.collection("users").where("password_hash", "==", password).get();
      const userDoc = snapshot.docs.find(doc => doc.data().email === identifier || doc.data().username === identifier);

      if (userDoc) {
        const userData = userDoc.data();
        if (userData.status === "activada") {
          return res.json({ success: true, user: userData });
        }
        return res.status(403).json({ success: false, error: "Tu cuenta no está activa o ha expirado." });
      }
      return res.status(401).json({ success: false, error: "Credenciales inválidas." });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- GESTIÓN DE CLAVES Y LICENCIAS (LOGICA DE 3 MESES) ---

  app.get("/api/admin/keys", async (req, res) => {
    try {
      const { status } = req.query;
      let query: any = db.collection("keys");
      if (status && status !== 'todas') query = query.where("status", "==", status);
      
      const snapshot = await query.orderBy("created_at", "desc").get();
      const now = new Date();
      const keys = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const createdDate = new Date(data.created_at);
        
        // 1. Lógica de 5 días para activarse (si sigue 'generada' o 'enviada')
        if (data.status !== 'activada' && data.status !== 'expirada') {
          const diffDays = Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 5) {
            await db.collection("keys").doc(doc.id).update({ status: 'expirada' });
            data.status = 'expirada';
          }
        }

        // 2. Lógica de 3 meses para claves ACTIVAS
        let daysToExpire = null;
        let warningMessage = null;

        if (data.status === 'activada' && data.activated_at) {
          const activatedAt = new Date(data.activated_at);
          const expireDate = new Date(activatedAt);
          expireDate.setMonth(expireDate.getMonth() + 3); // Sumar 3 meses

          const diffTime = expireDate.getTime() - now.getTime();
          daysToExpire = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Lógica de Mensajes Automáticos
          if (daysToExpire <= 0) {
            await db.collection("keys").doc(doc.id).update({ status: 'expirada' });
            await db.collection("users").doc(data.assigned_to).update({ status: 'expirada' });
            data.status = 'expirada';
            warningMessage = "Tu licencia se caduca hoy a las 11:59 pm";
          } else if (daysToExpire === 15) {
            warningMessage = "Aviso: Te quedan 15 días de acceso a ArlIE.";
          } else if (daysToExpire === 9) {
            warningMessage = "Aviso urgente: Tu acceso caduca en 9 días.";
          } else if (daysToExpire === 2) {
            warningMessage = "Atención: Solo quedan 2 días de tu licencia ArlIE.";
          }
        }

        keys.push({ 
          id: doc.id, 
          ...data, 
          daysLeft: daysToExpire,
          systemNote: warningMessage 
        });
      }
      res.json(keys);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/keys/update-status", async (req, res) => {
    try {
      const { keyId, newStatus, userEmail } = req.body;
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString() 
      };
      
      // Si se activa, marcamos el inicio de los 3 meses
      if (newStatus === 'activada') {
        updateData.activated_at = new Date().toISOString();
        if (userEmail) {
          await db.collection("users").doc(userEmail).update({ status: 'activada' });
        }
      }

      await db.collection("keys").doc(keyId).update(updateData);
      await db.collection("keys").doc(keyId).collection("history").add({
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: `Cambio a ${newStatus}`
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false });
    }
  });

  app.post("/api/admin/keys/generate", async (req, res) => {
    try {
      const keyStr = `ARL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await db.collection("keys").doc(keyStr).set({
        value: keyStr,
        status: "generada",
        created_at: new Date().toISOString(),
        assigned_to: req.body.userEmail || null
      });
      res.json({ success: true, key: keyStr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- CHAT IA ---
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, gender } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Eres ArlIE para estudiantes (${gender}). Responde empáticamente: ${message}`;
      const result = await model.generateContent(prompt);
      res.json({ reply: result.response.text() });
    } catch (e) {
      res.status(500).json({ error: "Error IA" });
    }
  });

  const distPath = path.resolve(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(Number(PORT), "0.0.0.0", () => console.log(`Server ArlIE on ${PORT}`));
}
startServer();