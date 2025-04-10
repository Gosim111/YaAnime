// [client/src/services/shikimoriApi.js] - Версия для Reg.ru хостинга

import axios from 'axios';

// !!! ВСЕГДА ИСПОЛЬЗУЕМ ОТНОСИТЕЛЬНЫЙ ПУТЬ !!!
const API_BASE = '/api/shiki';

console.log(`[ShikiAPI Client] Используемый API_BASE: ${API_BASE}`);

const apiClient = axios.create({
    baseURL: API_BASE, // Используем относительный путь
    timeout: 45000,
    headers: { 'Accept': 'application/json' }
});

// Обработчик ошибок Shikimori
const handleShikiError = (error, context = 'Shikimori API') => {
    console.error(`[${context}] Ошибка запроса:`, error.response?.status, error.code, error.message, error.config);
    let message = error.response?.data?.message || error.message || 'Неизвестная ошибка сети или API';
    // Упрощаем обработку, так как ошибки 5xx/4xx теперь могут быть от Nginx или нашего бэкенда
    if (error.response?.status === 404) { message = `Ресурс API не найден (${error.config.url})`; }
    else if (error.response?.status === 429) { message = 'Превышен лимит запросов (429). Попробуйте позже.'; }
    else if (error.response?.status >= 500) { message = `Ошибка сервера (${error.response.status}) при запросе к API.`; }
    else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) { message = `Превышено время ожидания ответа от сервера (${(error.config?.timeout || 45000) / 1000} сек)`; }
    else if (error.message === 'Network Error') { message = 'Ошибка сети. Проверьте подключение или доступность сервера.'; }
    return { data: null, pagination: null, error: new Error(message) };
};

const ITEMS_PER_PAGE_CATALOG = 28;
const PROHIBITED_GENRE_IDS = [12, 31, 32];

// Функция searchAnime (без изменений в логике)
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

// Функция getAnimeFullById (без изменений)
export const getAnimeFullById = async (id) => {
    if (!id) return { data: null, error: new Error("Shikimori ID не указан") };
    try {
        const response = await apiClient.get(`/animes/${id}`);
        const animeData = response.data;
        if (animeData && Array.isArray(animeData.genres)) { const hasProhibited = animeData.genres.some(g => PROHIBITED_GENRE_IDS.includes(Number(g.id))); if (hasProhibited) { return { data: null, error: new Error("Контент недоступен") }; } }
        return { data: animeData || null, error: null };
    } catch (error) { return handleShikiError(error, `getAnimeFullById(${id})`); }
};

// Функция getGenres (без изменений)
export const getGenres = async () => {
    try {
        const response = await apiClient.get('/genres');
        if (Array.isArray(response.data)) { const seenNames = new Set(); const uniqueValidGenres = []; for (const genre of response.data) { const displayName = genre.russian || genre.name; if (genre && genre.id && displayName && !PROHIBITED_GENRE_IDS.includes(Number(genre.id))) { if (!seenNames.has(displayName)) { seenNames.add(displayName); uniqueValidGenres.push(genre); } } } uniqueValidGenres.sort((a, b) => (a.russian || a.name).localeCompare(b.russian || b.name)); return { data: uniqueValidGenres, error: null }; }
        else { return { data: [], error: new Error('Некорректный ответ API жанров') }; }
    } catch (error) { return handleShikiError(error, 'getGenres'); }
};

// Функция getStudios (без изменений)
export const getStudios = async () => {
    try {
        const response = await apiClient.get('/studios');
        if (Array.isArray(response.data)) { response.data.sort((a, b) => a.name.localeCompare(b.name)); return { data: response.data, error: null }; }
        else { return { data: [], error: new Error('Некорректный ответ API студий') }; }
    } catch (error) { return handleShikiError(error, 'getStudios'); }
};