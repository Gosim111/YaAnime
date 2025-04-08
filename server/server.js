// [server/server.js]

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

dotenv.config();
const app = express();
app.use(express.json());

// --- CORS Настройка ---
const corsOptions = {
    origin: [process.env.CLIENT_URL || 'http://localhost:3000', 'https://67f432d20989e4217c93d7d4--moonlit-nasturtium-788927.netlify.app', 'https://yaanime.ru'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
console.log('[Server Startup] CORS настроен для:', corsOptions.origin);

// --- Константы и Кэш ---
const KODIK_TOKEN = process.env.KODIK_API_TOKEN;
const KODIK_API_BASE = 'https://kodikapi.com';
const SHIKI_API_BASE = 'https://shikimori.one/api';
const SHIKI_USER_AGENT = process.env.SHIKI_USER_AGENT || 'YaAnime/1.0 (Set User-Agent)';
const CACHE_TTL = 10 * 60 * 1000;
const shikiCache = { genres: { data: null, timestamp: 0 }, studios: { data: null, timestamp: 0 } };
if (!KODIK_TOKEN) { console.warn('[Server] ВНИМАНИЕ: KODIK_API_TOKEN не найден в .env!'); }
if (!SHIKI_USER_AGENT.includes('@')) { console.warn('[Server] ВНИМАНИЕ: SHIKI_USER_AGENT не выглядит как валидный User-Agent для Shikimori!'); }

// --- Роуты Прокси (ИСПРАВЛЕНЫ ПУТИ) ---

// !!! Путь изменен с /api/kodik/:endpoint на /kodik/:endpoint !!!
app.get('/kodik/:endpoint', async (req, res) => {
    const { endpoint } = req.params; const queryParams = req.query; const kodikApiUrl = `${KODIK_API_BASE}/${endpoint}`;
    if (!KODIK_TOKEN) { return res.status(500).json({ message: 'Ошибка конфигурации сервера (Kodik Token)' }); }
    const paramsForKodik = { ...queryParams, token: KODIK_TOKEN };
    console.log(`[Proxy Kodik] Обработка /kodik/${endpoint}`, queryParams); // Обновлен лог
    try {
        const response = await axios.get(kodikApiUrl, { params: paramsForKodik, timeout: 60000, headers: { 'Accept': 'application/json', 'User-Agent': 'YaAnimeBackendProxy/1.0' } });
        console.log(`[Proxy Kodik] Ответ от Kodik API (${endpoint}): ${response.status}`);
        res.setHeader('Content-Type', 'application/json'); res.status(response.status).send(response.data);
    } catch (error) {
        console.error(`[Proxy Kodik] Ошибка /kodik/${endpoint}:`, error.response?.status, error.code, error.message); const status = error.response?.status || 502; let message = 'Ошибка при обращении к Kodik API';
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) { message = `Таймаут запроса к Kodik API (${(error.config?.timeout || 60000) / 1000} сек)`; res.status(504).json({ error: `Gateway Timeout: ${message}` }); return; } // Используем 'error'
        if (error.response?.data?.error) { message = String(error.response.data.error); } else if (error.response?.data?.message) { message = String(error.response.data.message); } else if (error.message) { message = error.message; }
        res.status(status).json({ error: `Kodik API Error: ${message}` }); // Используем 'error'
    }
});

// !!! Путь изменен с /api/shiki/* на /shiki/* !!!
app.get('/shiki/*', async (req, res) => {
    const endpointPath = req.params[0]; // Теперь содержит путь ПОСЛЕ /shiki/
    const queryParams = req.query; const shikiApiUrl = `${SHIKI_API_BASE}/${endpointPath}`; const cacheKey = endpointPath === 'genres' || endpointPath === 'studios' ? endpointPath : null; const now = Date.now();
    console.log(`[Proxy Shiki] Обработка /shiki/${endpointPath}`, queryParams); // Обновлен лог

    // 1. Проверяем кэш
    if (cacheKey && shikiCache[cacheKey].data && (now - shikiCache[cacheKey].timestamp < CACHE_TTL)) {
        console.log(`[Proxy Shiki] Отдаем из кэша для ${cacheKey}`);
        res.setHeader('Content-Type', 'application/json'); res.setHeader('X-Cache-Hit', 'true');
        res.status(200).send(shikiCache[cacheKey].data); return;
    }

    // 2. Идем к API Shikimori
    try {
        console.log(`[Proxy Shiki] Отправка запроса к ${shikiApiUrl}`);
        const response = await axios.get(shikiApiUrl, { params: queryParams, timeout: 40000, headers: { 'User-Agent': SHIKI_USER_AGENT, 'Accept': 'application/json' } });
        console.log(`[Proxy Shiki] Ответ ПОЛУЧЕН от Shikimori API (${endpointPath}): ${response.status}`);
        const responseData = response.data;
        console.log(`[Proxy Shiki] Тип данных от Shikimori (${endpointPath}): ${typeof responseData}, Является ли массивом: ${Array.isArray(responseData)}`);

        // 3. Проверка и Кэширование для /genres и /studios
        if (cacheKey) {
            if (Array.isArray(responseData)) { console.log(`[Proxy Shiki] Кэшируем УСПЕШНЫЙ ответ для ${cacheKey}`); shikiCache[cacheKey].data = responseData; shikiCache[cacheKey].timestamp = Date.now(); }
            else { console.error(`[Proxy Shiki] ОШИБКА: Ответ для '${cacheKey}' от Shikimori НЕ является массивом!`); res.status(502).json({ error: `Bad Gateway: Некорректный ответ от Shikimori API для ${cacheKey}` }); return; }
        }

        // 4. Отправляем ответ клиенту
        res.setHeader('Content-Type', 'application/json');
        res.status(response.status).send(responseData);
        console.log(`[Proxy Shiki] Ответ ${response.status} успешно отправлен клиенту для /shiki/${endpointPath}.`);

    } catch (error) {
        // 5. Обработка ошибок Axios
        console.error(`[Proxy Shiki] ОШИБКА при запросе к ${shikiApiUrl}:`, error.response?.status, error.code, error.message);
        if (error.response?.data) { console.error("[Proxy Shiki] Тело ошибочного ответа от Shikimori:", error.response.data); }
        const status = error.response?.status || 502; let message = 'Ошибка при обращении к Shikimori API.';
        if (error.response?.status === 429) { message = 'Превышен лимит запросов к Shikimori API.'; res.status(429).json({ error: `Rate Limit Exceeded: ${message}` }); return; } // Используем 'error'
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) { message = `Таймаут запроса к Shikimori API (${(error.config?.timeout || 40000) / 1000} сек)`; res.status(504).json({ error: `Gateway Timeout: ${message}` }); return; } // Используем 'error'
        if (typeof error.response?.data === 'string' && error.response.data.length < 500) { message = error.response.data; } else if (error.response?.data?.message && typeof error.response.data.message === 'string') { message = error.response.data.message; } else if (error.message) { message = error.message; }
        res.status(status).json({ error: `Shikimori API Error (${status}): ${message}` }); // Используем 'error'
    }
});


// --- Стандартные Обработчики ---
app.get('/', (req, res) => { res.send(`YaAnime API Proxy (v4.1 - Fixed Routes) работает...`); });
// Обработчик 404 для НЕ /kodik/* и НЕ /shiki/*
app.use((req, res, next) => {
    if (!req.path.startsWith('/kodik/') && !req.path.startsWith('/shiki/')) {
        console.log(`[404 Handler] Неизвестный маршрут: ${req.path}`);
        res.status(404).json({ error: 'Ресурс не найден на прокси-сервере' });
    } else {
        next(); // Передаем дальше, если это API вызов (хотя он должен быть обработан выше)
    }
});
app.use((err, req, res, next) => { console.error("[Express Error Handler] Ошибка:", err); res.status(err.status || 500).json({ error: err.message || 'Внутренняя ошибка сервера (Express)' }); });
process.on('unhandledRejection', (reason, promise) => { console.error('Неперехваченный Promise Rejection:', promise, 'причина:', reason); });

// --- Запуск Сервера ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server (Proxy v4.1) is running on port ${PORT}.`));