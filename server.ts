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

// --- RUTA: REGISTRO (CAPTURA NOMBRE, APELLIDO Y GÉNERO) ---
app.post("/api/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, birthdate, gender } = req.body;
    
    const newUser = {
      first_name: first_name || "",
      last_name: last_name || "",
      email: email,
      username: email.split('@')[0],
      password_hash: password,
      phone: phone || "",
      birthdate: birthdate || "",
      gender: gender || "otro", // <--- MASCULINO, FEMENINO O OTRO
      status: "active",
      role: "estudiante",
      created_at: new Date().toISOString()
    };

    const docRef = await db.collection("users").add(newUser);
    res.json({ success: true, id: docRef.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- RUTA: LOGIN (DEVUELVE EL GÉNERO PARA EL COLOR) ---
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
    res.status(401).json({ error: "Usuario no encontrado." });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- RUTA: ADMIN KEYS (SIN PANTALLA NEGRA) ---
app.get("/api/admin/keys", async (req, res) => {
  try {
    const snapshot = await db.collection("keys").get();
    if (snapshot.empty) return res.json([]);
    const keys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(keys);
  } catch (e) {
    res.json([]);
  }
});

// --- RUTA: CHAT IA ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
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
  console.log(`ARLIE SERVER READY ON PORT ${PORT}`);
});