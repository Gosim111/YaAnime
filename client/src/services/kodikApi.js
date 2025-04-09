// [client/src/services/kodikApi.js]

import axios from 'axios';

// Определяем базовый URL так же, как в shikimoriApi.js
const API_BASE = import.meta.env.DEV
    ? '/api/kodik' // В разработке используем прокси Vite
    : `${import.meta.env.VITE_API_BASE_URL || ''}/api/kodik`; // В продакшене используем переменную окружения

console.log(`[KodikAPI Client] Используемый API_BASE: ${API_BASE}`); // Лог для отладки

const apiClient = axios.create({
    baseURL: API_BASE, // Используем определенный выше URL
    timeout: 65000, // Таймаут для запросов к прокси
});

// Обработчик ошибок Kodik (без изменений)
const handleKodikError = (error, context = 'Kodik API Client') => { /* ... как в шаге 44 ... */ };

/**
 * Ищет плеер Kodik по ID или названию.
 * @param {object} params - Параметры поиска (shikimori_id, kinopoisk_id, imdb_id, title).
 * @returns {Promise<{ kodik_link: string | null, id: string | null, error: Error | null }>}
 */
export const searchKodikPlayer = async (params = {}) => {
    const hasSearchParam = params.shikimori_id || params.kinopoisk_id || params.imdb_id || params.title;
    if (!hasSearchParam) { return { kodik_link: null, id: null, error: new Error("Для поиска Kodik нужен ID или title") }; }
    const requestParams = { limit: 1, with_material_data: false, ...params };
    try {
        // Запрос пойдет на API_BASE + '/search'
        const response = await apiClient.get('/search', { params: requestParams });
        if (response.data && Array.isArray(response.data.results) && response.data.results.length > 0) {
            const bestResult = response.data.results[0];
            const playerLink = bestResult.link && String(bestResult.link).trim() ? `https:${bestResult.link}` : null;
            if (playerLink) { return { kodik_link: playerLink, id: bestResult.id, error: null }; }
            else { return { kodik_link: null, id: bestResult.id, error: new Error('Плеер найден, но ссылка недействительна') }; }
        } else { const errorMessage = response.data?.results?.length === 0 ? 'Плеер Kodik не найден' : 'Некорректный ответ от Kodik API /search'; return { kodik_link: null, id: null, error: new Error(errorMessage) }; }
    } catch (error) { return handleKodikError(error, 'searchKodikPlayer'); }
};

// Функции getGenres/getYears удалены, т.к. не используются