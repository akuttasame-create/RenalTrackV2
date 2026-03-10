import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("renal_care.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    time TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS labs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    creatinine REAL,
    urea REAL,
    potassium REAL,
    hemoglobin REAL,
    tacrolimus REAL
  );

  CREATE TABLE IF NOT EXISTS vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    systolic INTEGER,
    diastolic INTEGER,
    weight REAL,
    temperature REAL
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/medications", (req, res) => {
    const rows = db.prepare("SELECT * FROM medications").all();
    res.json(rows);
  });

  app.post("/api/medications", (req, res) => {
    const { name, dosage, frequency, time } = req.body;
    const info = db.prepare("INSERT INTO medications (name, dosage, frequency, time) VALUES (?, ?, ?, ?)").run(name, dosage, frequency, time);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/medications/:id", (req, res) => {
    db.prepare("DELETE FROM medications WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/labs", (req, res) => {
    const rows = db.prepare("SELECT * FROM labs ORDER BY date DESC").all();
    res.json(rows);
  });

  app.post("/api/labs", (req, res) => {
    const { date, creatinine, urea, potassium, hemoglobin, tacrolimus } = req.body;
    const info = db.prepare("INSERT INTO labs (date, creatinine, urea, potassium, hemoglobin, tacrolimus) VALUES (?, ?, ?, ?, ?, ?)").run(date, creatinine, urea, potassium, hemoglobin, tacrolimus);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/vitals", (req, res) => {
    const rows = db.prepare("SELECT * FROM vitals ORDER BY date DESC").all();
    res.json(rows);
  });

  app.post("/api/vitals", (req, res) => {
    const { date, systolic, diastolic, weight, temperature } = req.body;
    const info = db.prepare("INSERT INTO vitals (date, systolic, diastolic, weight, temperature) VALUES (?, ?, ?, ?, ?)").run(date, systolic, diastolic, weight, temperature);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
