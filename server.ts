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

// REGISTRO: Sincronizado con los campos del formulario
app.post("/api/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password, gender } = req.body;
    const newUser = {
      first_name: first_name || "",
      last_name: last_name || "",
      email: email,
      username: email.split('@')[0],
      password_hash: password,
      gender: gender || "otro", 
      role: "estudiante",
      created_at: new Date().toISOString()
    };
    await db.collection("users").add(newUser);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// LOGIN: Envía el objeto 'user' con el género para activar los colores
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const snapshot = await db.collection("users").where("password_hash", "==", password).get();
    const userDoc = snapshot.docs.find(doc => 
      doc.data().email === identifier || doc.data().username === identifier
    );
    if (userDoc) return res.json({ success: true, user: userDoc.data() });
    res.status(401).json({ error: "Credenciales inválidas" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN: Evita pantalla negra devolviendo lista vacía si falla
app.get("/api/admin/keys", async (req, res) => {
  try {
    const snap = await db.collection("keys").get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch { res.json([]); }
});

app.post("/api/chat", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(req.body.message);
    res.json({ reply: result.response.text() });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) res.sendFile(path.join(distPath, "index.html"));
});

// Cambiamos a tsx para que corra el .ts en el servidor de Google
app.listen(process.env.PORT || 8080, "0.0.0.0");