import express from 'express';
import fetch from 'node-fetch'; // Якщо ви використовуєте fetch

const app = express();
const apiKey = '781afd86b6bc4ccaadde529d54fe0d91'; // Ваш API ключ

// Додаємо заголовки CORS для кожного запиту
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Дозволяємо доступ з будь-якого домену
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");

    // Якщо запит є попереднім (OPTIONS), відразу відповідаємо 200
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

// Проксі-ендпоінт для запитів до News API
app.get('/proxy/news', async (req, res) => {
    const query = req.query.q; // Отримуємо параметр пошуку з запиту
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data); // Відправляємо відповідь назад на фронтенд
    } catch (error) {
        res.status(500).json({ error: 'Помилка на сервері' });
    }
});

// Ваші інші маршрути
app.get('/data', (req, res) => {
    res.json({ message: "Дані отримано!" });
});

// Запуск сервера
app.listen(3000, () => {
    console.log('Сервер запущено на http://localhost:3000');
});

