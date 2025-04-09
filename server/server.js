// [server/server.js]

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
// УДАЛЕНЫ: cron, fs, path

dotenv.config();
const app = express();
app.use(express.json());

// --- CORS Настройка ---
// !!! Убедитесь, что CLIENT_URL в .env на Render === https://yaanime.ru !!!
const corsOptions = { origin: process.env.CLIENT_URL || 'http://localhost:3000', optionsSuccessStatus: 200 };
app.use(cors(corsOptions));
console.log(`[Server] CORS настроен для origin: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);


// --- Константы и Кэш ---
const KODIK_TOKEN = process.env.KODIK_API_TOKEN;
const KODIK_API_BASE = 'https://kodikapi.com';
const SHIKI_API_BASE = 'https://shikimori.one/api';
const SHIKI_USER_AGENT = process.env.SHIKI_USER_AGENT || 'YaAnime/1.0 (Set User-Agent)';
const CACHE_TTL = 10 * 60 * 1000; // 10 минут кэш для жанров/студий
const shikiCache = { genres: { data: null, timestamp: 0 }, studios: { data: null, timestamp: 0 } };
if (!KODIK_TOKEN) { console.warn('[Server Startup] ВНИМАНИЕ: KODIK_API_TOKEN не найден в .env!'); }

// --- Роуты Прокси ---

// Прокси для Kodik API (Таймаут 60 сек)
app.get('/api/kodik/:endpoint', async (req, res) => {
    const { endpoint } = req.params; const queryParams = req.query; const kodikApiUrl = `${KODIK_API_BASE}/${endpoint}`;
    if (!KODIK_TOKEN) { console.error('[Proxy Kodik] Отсутствует KODIK_API_TOKEN!'); return res.status(500).json({ message: 'Ошибка конфигурации сервера (Kodik Token)' }); }
    const paramsForKodik = { ...queryParams, token: KODIK_TOKEN };
    console.log(`[Proxy Kodik] Запрос: ${endpoint}`, queryParams); // Логируем параметры
    try {
        const response = await axios.get(kodikApiUrl, { params: paramsForKodik, timeout: 60000, headers: { 'Accept': 'application/json', 'User-Agent': 'YaAnimeBackendProxy/1.0' } });
        console.log(`[Proxy Kodik] Ответ от Kodik API (${endpoint}): ${response.status}`);
        res.setHeader('Content-Type', 'application/json'); res.status(response.status).send(response.data);
    } catch (error) {
        console.error(`[Proxy Kodik] Ошибка ${endpoint}:`, error.response?.status, error.code, error.message); const status = error.response?.status || 502; let message = 'Ошибка при обращении к Kodik API';
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) { message = `Таймаут запроса к Kodik API (${(error.config?.timeout || 60000) / 1000} сек)`; res.status(504).json({ message: `Gateway Timeout: ${message}` }); return; }
        if (error.response?.data?.error) { message = String(error.response.data.error); } else if (error.response?.data?.message) { message = String(error.response.data.message); } else if (error.message) { message = error.message; }
        res.status(status).json({ message: `Kodik API Error: ${message}` });
    }
});

// Прокси для Shikimori API (БЕЗ ФИЛЬТРАЦИИ ID, с кэшем genres/studios)
app.get('/api/shiki/*', async (req, res) => { // Используем * для захвата всего пути
    const endpointPath = req.params[0]; // Получаем путь после /api/shiki/
    const queryParams = req.query;
    const shikiApiUrl = `${SHIKI_API_BASE}/${endpointPath}`; // Формируем полный URL
    const cacheKey = endpointPath === 'genres' || endpointPath === 'studios' ? endpointPath : null; const now = Date.now();
    console.log(`[Proxy Shiki] Запрос получен для пути: /api/shiki/${endpointPath}`, queryParams);
    if (cacheKey && shikiCache[cacheKey].data && (now - shikiCache[cacheKey].timestamp < CACHE_TTL)) { console.log(`[Proxy Shiki] Отдаем из кэша для ${cacheKey}`); res.setHeader('Content-Type', 'application/json'); res.setHeader('X-Cache-Hit', 'true'); res.status(200).send(shikiCache[cacheKey].data); return; }
    try {
        console.log(`[Proxy Shiki] Запрос к Shikimori API: ${shikiApiUrl}`); // Логируем URL запроса
        const response = await axios.get(shikiApiUrl, { params: queryParams, timeout: 40000, headers: { 'User-Agent': SHIKI_USER_AGENT, 'Accept': 'application/json' } });
        console.log(`[Proxy Shiki] Ответ от Shikimori API (${endpointPath}): ${response.status}`); let responseData = response.data;
        // --- ФИЛЬТРАЦИЯ УДАЛЕНА ---
        if (cacheKey && Array.isArray(responseData)) { console.log(`[Proxy Shiki] Кэшируем ответ для ${cacheKey}`); shikiCache[cacheKey].data = responseData; shikiCache[cacheKey].timestamp = Date.now(); }
        res.setHeader('Content-Type', 'application/json'); res.status(response.status).send(responseData);
    } catch (error) {
        console.error(`[Proxy Shiki] Ошибка ${endpointPath}:`, error.response?.status, error.code, error.message); const status = error.response?.status || 502; let message = 'Ошибка при обращении к Shikimori API';
        if (error.response?.status === 429) { message = 'Превышен лимит запросов к Shikimori API. Попробуйте позже.'; res.status(429).json({ message: `Rate Limit Exceeded: ${message}` }); return; }
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) { message = `Таймаут запроса к Shikimori API (${(error.config?.timeout || 40000) / 1000} сек)`; res.status(504).json({ message: `Gateway Timeout: ${message}` }); return; }
        // Добавляем обработку 404 от самого Shikimori
        if (error.response?.status === 404) { message = `Ресурс не найден на Shikimori API (${endpointPath})`; res.status(404).json({ message }); return; }
        if (typeof error.response?.data === 'string' && error.response.data.length < 500) { message = error.response.data; } else if (error.response?.data?.message && typeof error.response.data.message === 'string') { message = error.response.data.message; } else if (error.message) { message = error.message; }
        res.status(status).json({ message: `Shikimori API Error: ${message}` });
    }
});


// --- Стандартные Обработчики ---
app.get('/', (req, res) => { res.send(`YaAnime API Proxy (v3 - Simple) работает...`); });
app.use((req, res, next) => { console.log(`[Server] 404 - Не найден маршрут: ${req.method} ${req.originalUrl}`); res.status(404).json({ message: 'Маршрут не найден на сервере' }); }); // Улучшенный лог 404
app.use((err, req, res, next) => { console.error("[Express Error Handler] Перехвачена ошибка:", err); res.status(err.status || 500).json({ message: err.message || 'Внутренняя ошибка сервера (Express)' }); });
process.on('unhandledRejection', (reason, promise) => { console.error('Неперехваченный Promise Rejection:', promise, 'причина:', reason); });

// --- Запуск Сервера ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server (Proxy v3) is running on port ${PORT}.`));