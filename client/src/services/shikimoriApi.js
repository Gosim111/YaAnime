// [client/src/services/shikimoriApi.js]

import axios from 'axios';

const API_PROXY_URL = '/api/shiki';
const apiClient = axios.create({ baseURL: API_PROXY_URL, timeout: 45000, headers: { 'Accept': 'application/json' } });

// Обработчик ошибок, ожидает { error: "..." } от бэкенда
const handleShikiError = (error, context = 'Shikimori API') => {
    console.error(`[${context}] Ошибка Axios:`, error);
    let message = 'Неизвестная ошибка при запросе к API.';
    if (error.response) {
        // Ошибка с ответом от сервера (прокси)
        console.error(`[${context}] Ответ сервера:`, error.response.status, error.response.data);
        // Пытаемся извлечь сообщение из поля "error"
        message = error.response.data?.error || `Ошибка сервера (${error.response.status})`;
    } else if (error.request) {
        // Запрос сделан, ответа нет
        message = 'Сервер не отвечает (таймаут или сеть).';
    } else {
        // Ошибка настройки запроса
        message = `Ошибка подготовки запроса: ${error.message}`;
    }
    console.error(`[${context}] Сформированное сообщение об ошибке: ${message}`);
    return { data: null, pagination: null, error: new Error(message) };
};

const PROHIBITED_GENRE_IDS = [12, 31, 32];

// searchAnime (без изменений, но будет использовать новый handleShikiError)
export const searchAnime = async (params = {}) => {
    const requestParams = { limit: params.limit || 28, page: params.page || 1, censored: 'false', ...params };
    Object.keys(requestParams).forEach(key => { /* ... очистка ... */ });
    try {
        const response = await apiClient.get('/animes', { params: requestParams });
        // !!! Добавляем проверку, что response.data - массив !!!
        if (!Array.isArray(response.data)) {
            console.warn(`[searchAnime] Ответ API не является массивом:`, response.data);
            throw new Error('Некорректный ответ API (ожидался массив)'); // Генерируем ошибку
        }
        const responseData = response.data;
        const paginationInfo = { currentPage: Number(requestParams.page) || 1, limit: Number(requestParams.limit) || 28, hasNextPage: responseData.length === (Number(requestParams.limit) || 28) };
        return { data: responseData, pagination: paginationInfo, error: null };
    } catch (error) {
        return handleShikiError(error, 'searchAnime');
    }
};

// getAnimeFullById (без изменений)
export const getAnimeFullById = async (id) => { /* ... */ };

// getGenres (Переписана для большей надежности)
export const getGenres = async () => {
    try {
        const response = await apiClient.get('/genres');
        // !!! СТРОГАЯ ПРОВЕРКА, ЧТО ПОЛУЧЕН МАССИВ !!!
        if (!Array.isArray(response.data)) {
            console.error('[getGenres] Ответ API НЕ является массивом:', response.data);
            // Генерируем ошибку, которую поймает catch и обработает handleShikiError
            throw new Error('Некорректный ответ API жанров (ожидался массив)');
        }

        // Фильтрация и сортировка (только если это массив)
        const seenNames = new Set(); const uniqueValidGenres = [];
        for (const genre of response.data) { const displayName = genre.russian || genre.name; if (genre && genre.id && displayName && !PROHIBITED_GENRE_IDS.includes(Number(genre.id))) { if (!seenNames.has(displayName)) { seenNames.add(displayName); uniqueValidGenres.push(genre); } } }
        uniqueValidGenres.sort((a, b) => (a.russian || a.name).localeCompare(b.russian || b.name));
        console.log(`[getGenres] Успешно обработано ${uniqueValidGenres.length} жанров.`);
        return { data: uniqueValidGenres, error: null };

    } catch (error) {
        // Ошибки Axios или ошибка 'Не массив' будут обработаны здесь
        return handleShikiError(error, 'getGenres');
    }
};
// getStudios (без изменений)
export const getStudios = async () => {
    try {
    const response = await apiClient.get('/studios'); // Запрос к /api/shiki/studios
    if (Array.isArray(response.data)) { response.data.sort((a, b) => a.name.localeCompare(b.name)); return { data: response.data, error: null }; }
    else { return { data: [], error: new Error('Некорректный ответ API студий') }; }
} catch (error) { return handleShikiError(error, 'getStudios'); }
};