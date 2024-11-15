import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Розширюємо CORS налаштування для розробки
app.use(cors({
    origin: ['http://localhost:8081', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../dist')));

// Додаємо тестовий endpoint
app.get('/api/test', (req, res) => {
    res.json({ status: 'Server is running!' });
});

app.get('/api/signed-url', async (req, res) => {
    console.log('Отримано запит на /api/signed-url');
    try {
        if (!process.env.XI_API_KEY || !process.env.AGENT_ID) {
            console.error('Відсутні змінні середовища:', { 
                XI_API_KEY: !!process.env.XI_API_KEY, 
                AGENT_ID: !!process.env.AGENT_ID 
            });
            throw new Error('Missing API key or Agent ID');
        }

        console.log('Надсилаємо запит до ElevenLabs API...');
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.AGENT_ID}`,
            {
                method: 'GET',
                headers: {
                    'xi-api-key': process.env.XI_API_KEY,
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Помилка від ElevenLabs API:', errorText);
            throw new Error(`API responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Успішно отримано signed URL');
        res.json({ signedUrl: data.signed_url });
    } catch (error) {
        console.error('Помилка сервера:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3030;

// Додаємо обробку помилок
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Запускаємо сервер з додатковим логуванням
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment variables:', {
        XI_API_KEY: !!process.env.XI_API_KEY,
        AGENT_ID: !!process.env.AGENT_ID,
        PORT: process.env.PORT
    });
});

server.on('error', (error) => {
    console.error('Server error:', error);
});