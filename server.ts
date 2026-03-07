import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Inicialización de Firebase (Asegúrate que el ID coincida)
initializeApp({ projectId: "arlie-chat" });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// 2. Usamos el nombre de variable que SÍ permite Google
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 8080;

  // RUTA DE REGISTRO - Mapeo completo de datos
  app.post("/api/register", async (req, res) => {
    try {
      const d = req.body;
      // Forzamos que cada campo se guarde con el nombre correcto
      const userData = {
        first_name: d.firstName || d.first_name || "",
        last_name: d.lastName || d.last_name || "",
        username: d.username || "",
        email: d.email || "",
        phone: d.phone || d.whatsapp || "",
        birthdate: d.birthdate || "",
        password_hash: d.password || d.password_hash || "",
        status: "active",
        created_at: new Date().toISOString()
      };

      await db.collection("users").doc(userData.email).set(userData);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // RUTA DE LOGIN
  app.post("/api/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;
      const snapshot = await db.collection("users").where("password_hash", "==", password).get();
      const userDoc = snapshot.docs.find(doc => 
        doc.data().email === identifier || doc.data().username === identifier
      );

      if (userDoc) return res.json({ success: true, user: userDoc.data() });
      return res.status(401).json({ success: false, error: "Credenciales inválidas" });
    } catch (e) {
      return res.status(500).json({ success: false, error: "Error de servidor" });
    }
  });

  // CONFIGURACIÓN PARA EVITAR PANTALLA NEGRA
  const distPath = path.resolve(__dirname, "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    // Si no es una ruta de API, entregamos el index.html para que React maneje el resto
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(distPath, "index.html"));
    }
  });

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log("Servidor ArlIE funcionando.");
  });
}

startServer();