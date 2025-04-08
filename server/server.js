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

// --- Роуты Прокси ---

// Прокси для Kodik API (Таймаут 60 сек)
app.get('/api/kodik/:endpoint', async (req, res) => {
    const { endpoint } = req.params; const queryParams = req.query; const kodikApiUrl = `${KODIK_API_BASE}/${endpoint}`;
    if (!KODIK_TOKEN) { return res.status(500).json({ message: 'Ошибка конфигурации сервера (Kodik Token)' }); }
    const paramsForKodik = { ...queryParams, token: KODIK_TOKEN };
    console.log(`[Proxy Kodik] Запрос: ${endpoint}`, queryParams);
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

// Прокси для Shikimori API (с кэшем genres/studios и проверкой ответа)
app.get('/api/shiki/*', async (req, res) => {
    const endpointPath = req.params[0]; const queryParams = req.query; const shikiApiUrl = `${SHIKI_API_BASE}/${endpointPath}`; const cacheKey = endpointPath === 'genres' || endpointPath === 'studios' ? endpointPath : null; const now = Date.now();
    console.log(`[Proxy Shiki] Запрос ПОЛУЧЕН: /api/shiki/${endpointPath}`, queryParams);

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

        // !!! 3. ПРОВЕРКА ОТВЕТА для /genres и /studios !!!
        if (cacheKey) {
            if (Array.isArray(responseData)) {
                // Ответ корректный (массив) - кэшируем
                console.log(`[Proxy Shiki] Кэшируем УСПЕШНЫЙ ответ для ${cacheKey}`);
                shikiCache[cacheKey].data = responseData;
                shikiCache[cacheKey].timestamp = Date.now();
            } else {
                // Ответ некорректный (НЕ массив) - логируем и возвращаем ошибку 502
                console.error(`[Proxy Shiki] ОШИБКА: Ответ для '${cacheKey}' от Shikimori НЕ является массивом!`, responseData);
                res.status(502).json({ message: `Bad Gateway: Некорректный ответ от Shikimori API для ${cacheKey} (ожидался массив)` });
                return; // Важно прервать выполнение
            }
        }
        // --- Конец проверки ---

        // 4. Фильтрация для /animes (больше не нужна, т.к. используем Kodik /list?)
        // ОСТАВИМ НА СЛУЧАЙ ВОЗВРАТА К SHIKI ДЛЯ СПИСКОВ, НО ОНА НЕ БУДЕТ ВЫПОЛНЯТЬСЯ, ТАК КАК availableShikiIds ПУСТ
        // if (endpointPath === 'animes' && Array.isArray(responseData)) { ... }

        // 5. Отправляем ответ клиенту (массив для genres/studios или данные для других эндпоинтов)
        res.setHeader('Content-Type', 'application/json');
        res.status(response.status).send(responseData);

    } catch (error) {
        // 6. Обработка ошибок Axios
        console.error(`[Proxy Shiki] ОШИБКА при запросе к ${shikiApiUrl}:`, error.response?.status, error.code, error.message);
        if (error.response?.data) { console.error("[Proxy Shiki] Тело ошибочного ответа от Shikimori:", error.response.data); }
        const status = error.response?.status || 502; let message = 'Ошибка при обращении к Shikimori API';
        if (error.response?.status === 429) { message = 'Превышен лимит запросов к Shikimori API.'; res.status(429).json({ message: `Rate Limit Exceeded: ${message}` }); return; }
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) { message = `Таймаут запроса к Shikimori API (${(error.config?.timeout || 40000) / 1000} сек)`; res.status(504).json({ message: `Gateway Timeout: ${message}` }); return; }
        if (typeof error.response?.data === 'string' && error.response.data.length < 500) { message = error.response.data; } else if (error.response?.data?.message && typeof error.response.data.message === 'string') { message = error.response.data.message; } else if (error.message) { message = error.message; }
        res.status(status).json({ message: `Shikimori API Error (${status}): ${message}` });
    }
});


// --- Стандартные Обработчики ---
app.get('/', (req, res) => { res.send(`YaAnime API Proxy (v3.2 - Simple, Log Enhanced) работает...`); });
app.use((req, res, next) => { res.status(404).json({ message: 'Ресурс не найден' }); });
app.use((err, req, res, next) => { console.error("[Express Error Handler] Ошибка:", err); res.status(err.status || 500).json({ message: err.message || 'Внутренняя ошибка сервера' }); });
process.on('unhandledRejection', (reason, promise) => { console.error('Неперехваченный Promise Rejection:', promise, 'причина:', reason); });

// --- Запуск Сервера ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server (Proxy v3.2) is running on port ${PORT}.`));