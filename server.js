import express from 'express';
import fetch from 'node-fetch'; // Для виконання HTTP запитів на сервері
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// Отримуємо шлях до поточної директорії
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Налаштовуємо сервер для відправки статичних файлів (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Створення маршруту для проксирування запитів до NewsAPI
app.get('/fetch-article', async (req, res) => {
    const apiKey = '781afd86b6bc4ccaadde529d54fe0d91';
    const query = req.query.q; // Отримання параметра q з URL

    try {
        const response = await fetch(`https://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`);
        const data = await response.json();
        res.json(data); // Відправка результату запиту клієнту
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Маршрут для відправки HTML сторінки
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Надсилаємо HTML файл клієнту
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cabinet_student.html')); // Надсилаємо HTML файл клієнту
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'view_results.html')); // Надсилаємо HTML файл клієнту
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'view_the_passed_result.html')); // Надсилаємо HTML файл клієнту
});

// Запуск сервера на порту 3000
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
