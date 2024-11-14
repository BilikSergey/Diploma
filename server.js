import express from 'express';
import fetch from 'node-fetch'; // Для виконання HTTP запитів на сервері
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Завантажуємо змінні середовища з .env файлу
dotenv.config();

const app = express();
const PORT = 3000;

// Отримуємо шлях до поточної директорії
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Налаштовуємо сервер для відправки статичних файлів (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'src')));
app.use(cors()); 
app.use(express.json());

// Створення маршруту для пошуку статей за допомогою API OpenAI
app.post('/search', async (req, res) => {
    const query = req.body.query; // Отримуємо параметр query з тіла запиту
    const apiKey = process.env.OPENAI_API_KEY; // Використовуємо ключ з .env файлу

    if (!apiKey) {
        console.error('API Key is missing. Please check your .env file.');
        process.exit(1);  // Завершити процес, якщо ключ відсутній
    }
    if (!query) {
        return res.status(400).json({ error: "Query is required" });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "text-davinci-003", // безкоштовна модель
                prompt: `Find articles related to the following topic: ${query}`,
                max_tokens: 150,
            }),
        });
        
        const data = await response.json();
        
        if (data && data.choices && data.choices.length > 0) {
            res.json(data.choices[0].text.trim()); // Отримуємо текст з `text`
        } else {
            res.status(500).json({ error: 'No choices available in the response', details: data });
        }
        

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data from OpenAI' });
    }
});

// Маршрут для відправки статичних HTML сторінок
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Запуск сервера на порту 3000
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

