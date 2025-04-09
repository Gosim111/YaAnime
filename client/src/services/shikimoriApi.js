// [client/src/services/shikimoriApi.js]

import axios from 'axios';

// Определяем базовый URL в зависимости от окружения
// import.meta.env.DEV - true во время `vite dev`, false при `vite build`
// import.meta.env.VITE_API_BASE_URL - переменная окружения для продакшена (URL бэкенда на Render)
const API_BASE = import.meta.env.DEV
    ? '/api/shiki' // В разработке используем прокси Vite
    : `${import.meta.env.VITE_API_BASE_URL || ''}/api/shiki`; // В продакшене используем переменную окружения

console.log(`[ShikiAPI Client] Используемый API_BASE: ${API_BASE}`); // Лог для отладки

const apiClient = axios.create({
    baseURL: API_BASE, // Используем определенный выше URL
    timeout: 45000,
    headers: { 'Accept': 'application/json' }
});

// Обработчик ошибок Shikimori (без изменений)
const handleShikiError = (error, context = 'Shikimori API') => { /* ... как в шаге 44 ... */ };

const ITEMS_PER_PAGE_CATALOG = 28;
const PROHIBITED_GENRE_IDS = [12, 31, 32];

// Функция searchAnime (без изменений в логике, использует новый apiClient)
export const searchAnime = async (params = {}) => {
    const requestParams = { limit: params.limit || ITEMS_PER_PAGE_CATALOG, page: params.page || 1, censored: 'false', ...params };
    Object.keys(requestParams).forEach(key => { if (requestParams[key] === null || requestParams[key] === undefined || requestParams[key] === '' || (Array.isArray(requestParams[key]) && requestParams[key].length === 0)) { delete requestParams[key]; } else if (Array.isArray(requestParams[key])) { if (requestParams[key].length > 0) { requestParams[key] = requestParams[key].join(','); } else { delete requestParams[key]; } } });
    try {
        // Запрос пойдет на API_BASE + '/animes'
        const response = await apiClient.get('/animes', { params: requestParams });
        const responseData = response.data || [];
        const paginationInfo = { currentPage: Number(requestParams.page) || 1, limit: Number(requestParams.limit) || ITEMS_PER_PAGE_CATALOG, hasNextPage: responseData.length === (Number(requestParams.limit) || ITEMS_PER_PAGE_CATALOG) };
        return { data: responseData, pagination: paginationInfo, error: null };
    } catch (error) { return handleShikiError(error, 'searchAnime'); }
};

// Функция getAnimeFullById (без изменений в логике)
export const getAnimeFullById = async (id) => {
    if (!id) return { data: null, error: new Error("Shikimori ID не указан") };
    try {
        // Запрос пойдет на API_BASE + '/animes/:id'
        const response = await apiClient.get(`/animes/${id}`);
        const animeData = response.data;
        if (animeData && Array.isArray(animeData.genres)) { const hasProhibited = animeData.genres.some(g => PROHIBITED_GENRE_IDS.includes(Number(g.id))); if (hasProhibited) return { data: null, error: new Error("Контент недоступен") }; }
        return { data: animeData || null, error: null };
    } catch (error) { return handleShikiError(error, `getAnimeFullById(${id})`); }
};

// Функция getGenres (без изменений в логике)
export const getGenres = async () => {
    try {
        // Запрос пойдет на API_BASE + '/genres'
        const response = await apiClient.get('/genres');
        if (Array.isArray(response.data)) { const seenNames = new Set(); const uniqueValidGenres = []; for (const genre of response.data) { const displayName = genre.russian || genre.name; if (genre && genre.id && displayName && !PROHIBITED_GENRE_IDS.includes(Number(genre.id))) { if (!seenNames.has(displayName)) { seenNames.add(displayName); uniqueValidGenres.push(genre); } } } uniqueValidGenres.sort((a, b) => (a.russian || a.name).localeCompare(b.russian || b.name)); return { data: uniqueValidGenres, error: null }; }
        else { return { data: [], error: new Error('Некорректный ответ API жанров') }; }
    } catch (error) { return handleShikiError(error, 'getGenres'); }
};

// Функция getStudios (без изменений в логике)
export const getStudios = async () => {
    try {
        // Запрос пойдет на API_BASE + '/studios'
        const response = await apiClient.get('/studios');
        if (Array.isArray(response.data)) { response.data.sort((a, b) => a.name.localeCompare(b.name)); return { data: response.data, error: null }; }
        else { return { data: [], error: new Error('Некорректный ответ API студий') }; }
    } catch (error) { return handleShikiError(error, 'getStudios'); }
};