// [client/src/services/shikimoriApi.js]

import axios from 'axios';

// !!! Используем переменную окружения для базового URL API !!!
const API_PROXY_URL = import.meta.env.VITE_API_BASE_URL || ''; // Пустой по умолчанию для локалки

const apiClient = axios.create({
    // Добавляем /api/shiki к базовому URL
    baseURL: `${API_PROXY_URL}/api/shiki`,
    timeout: 45000, // Таймаут для запросов к прокси Shikimori
    headers: { 'Accept': 'application/json' }
});

// Обработчик ошибок Shikimori
const handleShikiError = (error, context = 'Shikimori API') => {
    console.error(`[${context}] Ошибка запроса:`, error.response?.status, error.code, error.message);
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
const PROHIBITED_GENRE_IDS = [12, 31, 32];

// Функция для получения списков аниме
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

// Функция для страницы деталей
export const getAnimeFullById = async (id) => {
    if (!id) return { data: null, error: new Error("Shikimori ID не указан") };
    try {
        const response = await apiClient.get(`/animes/${id}`);
        const animeData = response.data;
        if (animeData && Array.isArray(animeData.genres)) { const hasProhibited = animeData.genres.some(g => PROHIBITED_GENRE_IDS.includes(Number(g.id))); if (hasProhibited) { console.warn(`[ShikiAPI Client] Аниме ID ${id} содержит запрещенный жанр.`); return { data: null, error: new Error("Контент недоступен") }; } }
        return { data: animeData || null, error: null };
    } catch (error) { return handleShikiError(error, `getAnimeFullById(${id})`); }
};

// Функция для получения жанров (с фильтрацией)
export const getGenres = async () => {
    try {
        const response = await apiClient.get('/genres');
        if (Array.isArray(response.data)) { const seenNames = new Set(); const uniqueValidGenres = []; for (const genre of response.data) { const displayName = genre.russian || genre.name; if (genre && genre.id && displayName && !PROHIBITED_GENRE_IDS.includes(Number(genre.id))) { if (!seenNames.has(displayName)) { seenNames.add(displayName); uniqueValidGenres.push(genre); } } } uniqueValidGenres.sort((a, b) => (a.russian || a.name).localeCompare(b.russian || b.name)); return { data: uniqueValidGenres, error: null }; }
        else { return { data: [], error: new Error('Некорректный ответ API жанров') }; }
    } catch (error) { return handleShikiError(error, 'getGenres'); }
};

// Функция для получения студий
export const getStudios = async () => {
    try {
        const response = await apiClient.get('/studios');
        if (Array.isArray(response.data)) { response.data.sort((a, b) => a.name.localeCompare(b.name)); return { data: response.data, error: null }; }
        else { return { data: [], error: new Error('Некорректный ответ API студий') }; }
    } catch (error) { return handleShikiError(error, 'getStudios'); }
};