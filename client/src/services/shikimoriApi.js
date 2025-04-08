// [client/src/services/shikimoriApi.js]

import axios from 'axios';

const API_PROXY_URL = '/api/shiki';
const apiClient = axios.create({ baseURL: API_PROXY_URL, timeout: 45000, headers: { 'Accept': 'application/json' } });

// !!! ИСПРАВЛЕН handleShikiError - возвращает { data, error } !!!
const handleShikiError = (error, context = 'Shikimori API') => {
    console.error(`[${context}] Ошибка Axios:`, error); // Логируем всю ошибку для диагностики
    let message = 'Неизвестная ошибка при запросе к API.';
    if (error.response) {
        console.error(`[${context}] Ответ сервера:`, error.response.status, error.response.data);
        message = error.response.data?.error // Ожидаем { error: "..." } от бэкенда
            || error.response.data?.message // Или { message: "..." }
            || `Ошибка сервера (${error.response.status})`;
    } else if (error.request) {
        message = 'Сервер не отвечает (таймаут или сеть).';
    } else {
        message = `Ошибка подготовки запроса: ${error.message}`;
    }
    console.error(`[${context}] Сформированное сообщение об ошибке: ${message}`);
    // !!! ВСЕГДА возвращаем объект с data и error !!!
    return { data: null, error: new Error(message) };
};

const PROHIBITED_GENRE_IDS = [12, 31, 32];

// searchAnime (без изменений, использует handleShikiError)
export const searchAnime = async (params = {}) => {
    const requestParams = { limit: params.limit || 28, page: params.page || 1, censored: 'false', ...params };
    Object.keys(requestParams).forEach(key => { if (requestParams[key] == null || requestParams[key] === '' || (Array.isArray(requestParams[key]) && requestParams[key].length === 0)) { delete requestParams[key]; } else if (Array.isArray(requestParams[key])) { requestParams[key] = requestParams[key].join(','); } });
    try {
        const response = await apiClient.get('/animes', { params: requestParams });
        if (!Array.isArray(response.data)) { throw new Error('Некорректный ответ API (ожидался массив)'); }
        const paginationInfo = { currentPage: Number(requestParams.page) || 1, limit: Number(requestParams.limit) || 28, hasNextPage: response.data.length === (Number(requestParams.limit) || 28) };
        return { data: response.data, pagination: paginationInfo, error: null };
    } catch (error) {
        return handleShikiError(error, 'searchAnime');
    }
};

// !!! ИСПРАВЛЕН getAnimeFullById - Явный return в catch !!!
export const getAnimeFullById = async (id) => {
    if (!id) return { data: null, error: new Error("Shikimori ID не указан") };
    try {
        const response = await apiClient.get(`/animes/${id}`);
        const animeData = response.data;
        // Проверка на null/undefined перед доступом к genres
        if (animeData && Array.isArray(animeData.genres)) {
            const hasProhibited = animeData.genres.some(g => g && typeof g.id === 'number' && PROHIBITED_GENRE_IDS.includes(g.id));
            if (hasProhibited) {
                console.warn(`[getAnimeFullById] Аниме ID ${id} содержит запрещенный жанр.`);
                // Возвращаем ошибку, чтобы показать ее пользователю
                return { data: null, error: new Error("Контент недоступен из-за возрастных ограничений или политики") };
            }
        }
        // Возвращаем null, если animeData не объект
        return { data: (animeData && typeof animeData === 'object') ? animeData : null, error: null };
    } catch (error) {
        // !!! Явно возвращаем результат handleShikiError !!!
        return handleShikiError(error, `getAnimeFullById(${id})`);
    }
};


// getGenres (без изменений, использует handleShikiError)
export const getGenres = async () => {
    try {
        const response = await apiClient.get('/genres');
        if (!Array.isArray(response.data)) { throw new Error('Некорректный ответ API жанров (ожидался массив)'); }
        const seenNames = new Set(); const uniqueValidGenres = [];
        for (const genre of response.data) { const displayName = genre.russian || genre.name; if (genre && genre.id && displayName && !PROHIBITED_GENRE_IDS.includes(Number(genre.id))) { if (!seenNames.has(displayName)) { seenNames.add(displayName); uniqueValidGenres.push(genre); } } }
        uniqueValidGenres.sort((a, b) => (a.russian || a.name).localeCompare(b.russian || b.name));
        return { data: uniqueValidGenres, error: null };
    } catch (error) { return handleShikiError(error, 'getGenres'); }
};

// getStudios (без изменений)
export const getStudios = async () => { /* ... */ };