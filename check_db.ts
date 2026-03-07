import Database from "better-sqlite3";
const db = new Database("arlie.db");
const history = db.prepare("SELECT * FROM chat_history LIMIT 10").all();
console.log("Chat History:", JSON.stringify(history, null, 2));
const sessions = db.prepare("SELECT * FROM chat_sessions LIMIT 10").all();
console.log("Chat Sessions:", JSON.stringify(sessions, null, 2));
