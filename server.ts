import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialización de Firebase Admin para conectar con Firestore
if (!getApps().length) {
    initializeApp({ projectId: "arlie-chat" });
}
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// Configuración de la IA de Google Gemini
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

const app = express();
app.use(express.json());

// API: Registro de Usuario (Captura género para definir el color de la interfaz)
app.post("/api/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password, gender, phone, birthdate } = req.body;
    
    const newUser = {
      first_name: first_name || "",
      last_name: last_name || "",
      email: email,
      username: email.split('@')[0],
      password_hash: password,
      gender: gender || "femenino", // Define si el tema será Morado o Verde
      phone: phone || "",
      birthdate: birthdate || "",
      role: "estudiante",
      status: "active",
      created_at: new Date().toISOString()
    };

    await db.collection("users").add(newUser);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// API: Login de Usuario (Envía los datos al frontend para ajustar el color)
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
    res.status(401).json({ error: "Credenciales inválidas" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Servir la aplicación de React (Vite build)
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"));
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor ArlIE corriendo en puerto ${PORT}`);
});