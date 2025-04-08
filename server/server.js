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

// --- Константы ---
const KODIK_TOKEN = process.env.KODIK_API_TOKEN;
const KODIK_API_BASE = 'https://kodikapi.com';
const SHIKI_API_BASE = 'https://shikimori.one/api';
const SHIKI_USER_AGENT = process.env.SHIKI_USER_AGENT || 'YaAnime/1.0 (Set User-Agent)';
if (!KODIK_TOKEN) { console.warn('[Server] ВНИМАНИЕ: KODIK_API_TOKEN не найден в .env!'); }
if (!SHIKI_USER_AGENT.includes('@')) { console.warn('[Server] ВНИМАНИЕ: SHIKI_USER_AGENT не выглядит как валидный User-Agent для Shikimori!'); }

// --- Роуты Прокси ---

// Прокси для Kodik API (Таймаут 60 сек)
app.get('/api/kodik/:endpoint', async (req, res) => { /* ... код как в шаге 44 ... */ });

// !!! ПЕРЕПИСАННЫЙ Прокси для Shikimori API !!!
app.get('/api/shiki/*', async (req, res) => {
    const endpointPath = req.params[0];
    const queryParams = req.query;
    const shikiApiUrl = `${SHIKI_API_BASE}/${endpointPath}`;
    console.log(`[Proxy Shiki] Запрос ПОЛУЧЕН: /api/shiki/${endpointPath}`, queryParams);

    try {
        console.log(`[Proxy Shiki] Отправка запроса к ${shikiApiUrl}`);
        const response = await axios.get(shikiApiUrl, {
            params: queryParams,
            timeout: 40000, // Таймаут для запроса к Shikimori
            headers: { 'User-Agent': SHIKI_USER_AGENT, 'Accept': 'application/json' }
        });
        console.log(`[Proxy Shiki] Ответ ПОЛУЧЕН от Shikimori API (${endpointPath}). Статус: ${response.status}`);

        // Логируем ТИП полученных данных
        console.log(`[Proxy Shiki] Тип данных от Shikimori (${endpointPath}): ${typeof response.data}, Является ли массивом: ${Array.isArray(response.data)}`);

        // !! Важно: Отправляем клиенту ТО, ЧТО ПРИШЛО от Shikimori !!
        res.setHeader('Content-Type', 'application/json');
        res.status(response.status).send(response.data);
        console.log(`[Proxy Shiki] Ответ ${response.status} успешно отправлен клиенту для /api/shiki/${endpointPath}.`);

    } catch (error) {
        // Тщательная обработка ошибок Axios
        let status = 502; // Bad Gateway по умолчанию для ошибок связи с Shikimori
        let message = 'Не удалось получить ответ от Shikimori API.';

        if (error.response) {
            // Ошибка пришла с ответом от Shikimori (4xx, 5xx)
            status = error.response.status;
            console.error(`[Proxy Shiki] Ошибка от Shikimori API (${endpointPath}). Статус: ${status}. Тело:`, error.response.data);
            if (status === 401) message = 'Ошибка авторизации при запросе к Shikimori (проверьте User-Agent).';
            else if (status === 404) message = 'Ресурс не найден на Shikimori API.';
            else if (status === 429) message = 'Превышен лимит запросов к Shikimori API (Rate Limit).';
            else if (status >= 400 && status < 500) message = `Ошибка запроса к Shikimori (${status}): ${error.response.data?.message || 'Неверные параметры'}`;
            else if (status >= 500) message = `Внутренняя ошибка сервера Shikimori API (${status}).`;
            // Формируем тело ошибки для клиента
            message = `Shikimori API Error (${status}): ${message}`;
        } else if (error.request) {
            // Запрос был сделан, но ответа не было (таймаут, сеть)
            console.error(`[Proxy Shiki] Нет ответа от ${shikiApiUrl}. Код: ${error.code}. Сообщение: ${error.message}`);
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                status = 504; // Gateway Timeout
                message = `Gateway Timeout: Таймаут запроса к Shikimori API (${(error.config?.timeout || 40000) / 1000} сек).`;
            } else {
                message = `Network Error: Не удалось связаться с Shikimori API.`;
            }
        } else {
            // Ошибка на этапе настройки запроса
            console.error('[Proxy Shiki] Ошибка настройки запроса Axios:', error.message);
            status = 500; // Internal Server Error (нашего прокси)
            message = `Internal Server Error: Ошибка при подготовке запроса к Shikimori.`;
        }

        // Отправляем стандартизированный ответ об ошибке клиенту
        res.status(status).json({ error: message }); // Используем ключ "error"
        console.log(`[Proxy Shiki] Ошибка ${status} отправлена клиенту для /api/shiki/${endpointPath}.`);
    }
});


// --- Стандартные Обработчики ---
app.get('/', (req, res) => { res.send(`YaAnime API Proxy (v4 - Robust Error Handling) работает...`); });
app.use((req, res, next) => { res.status(404).json({ error: 'Ресурс не найден на прокси-сервере' }); }); // Используем "error"
app.use((err, req, res, next) => { console.error("[Express Error Handler] Ошибка:", err); res.status(err.status || 500).json({ error: err.message || 'Внутренняя ошибка сервера (Express)' }); }); // Используем "error"
process.on('unhandledRejection', (reason, promise) => { console.error('Неперехваченный Promise Rejection:', promise, 'причина:', reason); });

// --- Запуск Сервера ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server (Proxy v4) is running on port ${PORT}.`));