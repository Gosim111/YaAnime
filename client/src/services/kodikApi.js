// [client/src/services/kodikApi.js]

import axios from 'axios';

// Определяем базовый URL так же, как в shikimoriApi.js
const API_BASE = import.meta.env.DEV
    ? '/api/kodik' // В разработке используем прокси Vite
    : `${import.meta.env.VITE_API_BASE_URL || ''}/api/kodik`; // В продакшене используем переменную окружения

// !!! Лог для проверки !!!
console.log(`[KodikAPI Client] Используемый API_BASE: ${API_BASE}`);

const apiClient = axios.create({
    baseURL: API_BASE, // Используем определенный выше URL
    timeout: 65000, // Увеличенный таймаут
});

// Обработчик ошибок Kodik
const handleKodikError = (error, context = 'Kodik API Client') => {
    console.error(`[${context}] Ошибка запроса:`, error.response?.status, error.code, error.message, error.config);
    let message = error.response?.data?.message || error.message || 'Неизвестная ошибка сети или Kodik API';

    // Сообщения об ошибках от нашего прокси
    if (error.response?.data?.message && error.response?.data?.message.startsWith('Kodik API Error:')) { message = error.response.data.message.replace('Kodik API Error:', '').trim(); }
    else if (error.response?.data?.message && error.response?.data?.message.startsWith('Gateway Timeout:')) { message = error.response.data.message; }
    // Таймаут самого фронтенда
    else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) { message = `Превышено время ожидания ответа от сервера (${(error.config?.timeout || 65000) / 1000} сек)`; }
    // Другие статусы ответа от прокси
    else if (error.response?.status === 404) { message = 'Ресурс плеера не найден.'; }
    else if (error.response?.status === 500) { message = 'Внутренняя ошибка сервера при запросе к Kodik.'; }
    else if (error.response?.status >= 502 && error.response?.status <= 504) { message = `Ошибка шлюза (${error.response.status}) при доступе к Kodik API.`; }

    return { kodik_link: null, id: null, error: new Error(message) }; // Возвращаем структуру как раньше
};


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
        } else {
            const errorMessage = response.data?.results?.length === 0 ? 'Плеер Kodik не найден' : 'Некорректный ответ от Kodik API /search';
            return { kodik_link: null, id: null, error: new Error(errorMessage) };
        }
    } catch (error) {
        return handleKodikError(error, 'searchKodikPlayer'); // Используем обработчик
    }
};

// Функции getGenres/getYears удалены