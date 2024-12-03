import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Імітація __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Налаштування статичних файлів
app.use(express.static(path.join(__dirname, "src")));

// Головна сторінка
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const port = 3000;
app.listen(port, () => {
  console.log(`Сервер працює на http://localhost:${port}`);
});
