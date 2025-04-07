// [client/src/services/jikanApi.js]

import axios from 'axios';

const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';

const jikanApiClient = axios.create({ baseURL: JIKAN_API_BASE_URL, timeout: 15000, });

const handleJikanError = (error, context = 'Jikan API') => { console.error(`[${context}] Ошибка запроса:`, error.response?.data || error.message); const message = error.response?.data?.message || error.message || 'Ошибка сети или Jikan API'; if (error.response?.status === 429) { return { data: null, pagination: null, error: new Error('Слишком много запросов к Jikan API. Попробуйте позже.') }; } if (error.response?.status === 400) { return { data: [], pagination: null, error: new Error(`Неверные параметры запроса к Jikan: ${message}`) }; } return { data: null, pagination: null, error: new Error(message) }; };

export const getTopAnime = async (params = {}) => { const requestParams = { limit: 15, sfw: true, filter: 'bypopularity', ...params, }; try { const response = await jikanApiClient.get('/top/anime', { params: requestParams }); return { data: response.data?.data || [], pagination: response.data?.pagination || null, error: null }; } catch (error) { return handleJikanError(error, 'getTopAnime'); } };
export const getSeasonNow = async (params = {}) => { const requestParams = { limit: 12, sfw: true, ...params, }; try { const response = await jikanApiClient.get('/seasons/now', { params: requestParams }); return { data: response.data?.data || [], pagination: response.data?.pagination || null, error: null }; } catch (error) { return handleJikanError(error, 'getSeasonNow'); } };

/**
 * Получает список недавно вышедших аниме по дате старта.
 */
export const getRecentAnime = async (params = {}) => {
    // ! Упрощенные параметры для /anime
    const requestParams = {
        limit: 12, // Запрашиваем нужное количество
        sfw: true,
        order_by: 'start_date', // Сортируем по дате начала
        sort: 'desc',
        // Убрали status и type, чтобы избежать ошибки 400
        // status: 'airing,complete,upcoming',
        // type: 'tv,movie,ova,ona,special',
        ...params, // Позволяем переопределить limit, order_by, sort
    };
    try {
        if (import.meta.env.DEV) console.log('[JikanAPI] Запрос /anime (для recent):', requestParams);
        const response = await jikanApiClient.get('/anime', { params: requestParams });
        if (import.meta.env.DEV) console.log('[JikanAPI] Ответ /anime (для recent):', response.data);
        return {
            data: response.data?.data || [],
            pagination: response.data?.pagination || null,
            error: null
        };
    } catch (error) {
        return handleJikanError(error, 'getRecentAnime');
    }
};

/**
 * Ищет аниме по названию и другим параметрам.
 */
const ITEMS_PER_PAGE_CATALOG = 24; // Определяем константу
export const searchAnime = async (params = {}) => {
    let orderBy = params.order_by; let sortDirection = params.sort || 'desc';
    if (params.sortCombined) { const sortParts = params.sortCombined.split('_'); sortDirection = sortParts.pop(); orderBy = sortParts.join('_'); delete params.sortCombined; }
    const jikanSortFields = { 'title': 'title', 'start_date': 'start_date', 'score': 'score', 'members': 'members', 'episodes': 'episodes', };
    const validOrderBy = jikanSortFields[orderBy] || orderBy;
    const requestParams = { limit: ITEMS_PER_PAGE_CATALOG, sfw: true, ...params, order_by: validOrderBy, sort: sortDirection, };
    // ! Убираем фильтр по жанрам (требует ID)
    if (requestParams.genres) { console.warn("Фильтр по жанрам по названию пока не поддерживается Jikan /anime."); delete requestParams.genres; }
    try {
        if (import.meta.env.DEV) console.log('[JikanAPI] Запрос /anime (search/catalog):', requestParams);
        const response = await jikanApiClient.get('/anime', { params: requestParams });
        if (import.meta.env.DEV) console.log('[JikanAPI] Ответ /anime (search/catalog):', response.data);
        return { data: response.data?.data || [], pagination: response.data?.pagination || { last_visible_page: 1, has_next_page: false, current_page: 1, items: { total: 0, count: 0, per_page: 0}}, error: null };
    } catch (error) { return handleJikanError(error, 'searchAnime'); }
};

export const getAnimeFullById = async (id) => { /* ... (без изменений) ... */ if (!id) return { data: null, error: new Error("MAL ID не указан") }; try { const response = await jikanApiClient.get(`/anime/${id}/full`); return { data: response.data?.data || null, error: null }; } catch (error) { if (error.response?.status === 404) { return { data: null, error: new Error(`Аниме с MAL ID ${id} не найдено на MyAnimeList`) }; } return handleJikanError(error, `getAnimeFullById(${id})`); } };
export const getAnimeGenres = async () => { /* ... (без изменений) ... */ try { const response = await jikanApiClient.get('/genres/anime'); return { data: response.data?.data || [], error: null }; } catch (error) { return handleJikanError(error, 'getAnimeGenres'); } };