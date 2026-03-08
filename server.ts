import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!getApps().length) {
    initializeApp({ projectId: "arlie-chat" });
}
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");
const app = express();
app.use(express.json());

// REGISTRO: Asegura que Nombres y Género entren a Firestore
app.post("/api/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password, gender } = req.body;
    const newUser = {
      first_name: first_name || "",
      last_name: last_name || "",
      email: email,
      username: email.split('@')[0],
      password_hash: password,
      gender: gender || "masculino", 
      role: "estudiante",
      status: "active",
      created_at: new Date().toISOString()
    };
    const docRef = await db.collection("users").add(newUser);
    res.json({ success: true, id: docRef.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// LOGIN: Devuelve el usuario completo (incluyendo género para el color)
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const snapshot = await db.collection("users").where("password_hash", "==", password).get();
    const userDoc = snapshot.docs.find(doc => 
        doc.data().email === identifier || doc.data().username === identifier
    );
    if (userDoc) return res.json({ success: true, user: userDoc.data() });
    res.status(401).json({ error: "Credenciales incorrectas" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN: Blindado contra errores de lectura
app.get("/api/admin/keys", async (req, res) => {
  try {
    const snapshot = await db.collection("keys").get();
    if (snapshot.empty) return res.json([]);
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch {
    res.json([]);
  }
});

// CHAT IA
app.post("/api/chat", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(req.body.message);
    res.json({ reply: result.response.text() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`>>> Servidor ArlIE iniciado en puerto ${PORT}`);
});