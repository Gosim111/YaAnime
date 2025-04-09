// [client/src/services/shikimoriApi.js]

import axios from 'axios';

// Определяем базовый URL в зависимости от окружения
const API_BASE = import.meta.env.DEV
    ? '/api/shiki' // В разработке используем прокси Vite
    : `${import.meta.env.VITE_API_BASE_URL || ''}/api/shiki`; // В продакшене используем переменную окружения

console.log(`[ShikiAPI Client] Используемый API_BASE: ${API_BASE}`);

const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 45000, // Оставляем увеличенный таймаут
    headers: { 'Accept': 'application/json' }
});

// Обработчик ошибок Shikimori
const handleShikiError = (error, context = 'Shikimori API') => {
    console.error(`[${context}] Ошибка запроса:`, error.response?.status, error.code, error.message, error.config);
    let message = error.response?.data?.message || error.message || 'Неизвестная ошибка сети или API';

    if (error.response?.data?.message && error.response?.data?.message.startsWith('Shikimori API Error:')) { message = error.response.data.message.replace('Shikimori API Error:', '').trim(); }
    else if (error.response?.data?.message && error.response?.data?.message.startsWith('Gateway Timeout:')) { message = error.response.data.message; }
    else if (error.response?.data?.message && error.response?.data?.message.startsWith('Rate Limit Exceeded:')) { message = error.response.data.message; }
    else if (error.response?.status === 401) { message = 'Ошибка аутентификации прокси'; }
    else if (error.response?.status === 404) { message = 'Ресурс не найден.'; }
    else if (error.response?.status === 429) { message = 'Превышен лимит запросов (429). Попробуйте позже.'; }
    else if (error.response?.status === 400 || error.response?.status === 422) { message = `Неверные параметры запроса (${error.response.status})`; }
    else if (error.response?.status >= 500) { message = `Ошибка сервера (${error.response.status}). Попробуйте позже.`; }
    else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) { message = `Превышено время ожидания ответа (${(error.config?.timeout || 45000) / 1000} сек)`; }

    return { data: null, pagination: null, error: new Error(message) };
};


const ITEMS_PER_PAGE_CATALOG = 28;
// --- УДАЛЕНА КОНСТАНТА PROHIBITED_GENRE_IDS ---

// Функция для получения списков аниме (без изменений)
export const searchAnime = async (params = {}) => {
    const requestParams = { limit: params.limit || ITEMS_PER_PAGE_CATALOG, page: params.page || 1, censored: 'false', ...params };
    Object.keys(requestParams).forEach(key => { if (requestParams[key] === null || requestParams[key] === undefined || requestParams[key] === '' || (Array.isArray(requestParams[key]) && requestParams[key].length === 0)) { delete requestParams[key]; } else if (Array.isArray(requestParams[key])) { if (requestParams[key].length > 0) { requestParams[key] = requestParams[key].join(','); } else { delete requestParams[key]; } } });
    try {
        const response = await apiClient.get('/animes', { params: requestParams });
        const responseData = response.data || [];
        const paginationInfo = { currentPage: Number(requestParams.page) || 1, limit: Number(requestParams.limit) || ITEMS_PER_PAGE_CATALOG, hasNextPage: responseData.length === (Number(requestParams.limit) || ITEMS_PER_PAGE_CATALOG) };
        return { data: responseData, pagination: paginationInfo, error: null };
    } catch (error) { return handleShikiError(error, 'searchAnime'); }
};

// Функция для страницы деталей (удалена проверка на запрещенные жанры)
export const getAnimeFullById = async (id) => {
    if (!id) return { data: null, error: new Error("Shikimori ID не указан") };
    try {
        const response = await apiClient.get(`/animes/${id}`);
        const animeData = response.data;
        // --- УДАЛЕНА ПРОВЕРКА НА ЗАПРЕЩЕННЫЕ ЖАНРЫ ---
        // if (animeData && Array.isArray(animeData.genres)) { ... }
        // ---
        return { data: animeData || null, error: null }; // Просто возвращаем данные
    } catch (error) { return handleShikiError(error, `getAnimeFullById(${id})`); }
};

// Функция для получения жанров (удалена фильтрация запрещенных ID)
export const getGenres = async () => {
    try {
        const response = await apiClient.get('/genres');
        if (Array.isArray(response.data)) {
            const seenNames = new Set();
            const uniqueValidGenres = [];
            console.log(`[getGenres] Получено ${response.data.length} жанров от API.`);

            for (const genre of response.data) {
                const displayName = genre.russian || genre.name;
                // --- УДАЛЕНА ПРОВЕРКА !PROHIBITED_GENRE_IDS.includes(...) ---
                if (genre && genre.id && displayName) { // Проверяем только базовое наличие ID и названия
                    if (!seenNames.has(displayName)) {
                        seenNames.add(displayName);
                        uniqueValidGenres.push(genre);
                    }
                }
                // ---
            }
            uniqueValidGenres.sort((a, b) => (a.russian || a.name).localeCompare(b.russian || b.name));
            console.log(`[getGenres] Возвращаем ${uniqueValidGenres.length} уникальных жанров (без фильтрации запрещенных).`);
            return { data: uniqueValidGenres, error: null };
        } else {
            console.error('[ShikiAPI Client] Некорректный ответ от /genres (не массив):', response.data);
            return { data: [], error: new Error('Некорректный ответ от API жанров') };
        }
    } catch (error) { return handleShikiError(error, 'getGenres'); }
};

// Функция для получения студий (без изменений)
export const getStudios = async () => {
    try {
        const response = await apiClient.get('/studios');
        if (Array.isArray(response.data)) { response.data.sort((a, b) => a.name.localeCompare(b.name)); return { data: response.data, error: null }; }
        else { return { data: [], error: new Error('Некорректный ответ API студий') }; }
    } catch (error) { return handleShikiError(error, 'getStudios'); }
};