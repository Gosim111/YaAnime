// [client/src/services/kodikApi.js] - Версия для Reg.ru хостинга

import axios from 'axios';

// !!! ВСЕГДА ИСПОЛЬЗУЕМ ОТНОСИТЕЛЬНЫЙ ПУТЬ !!!
const API_BASE = '/api/kodik';

console.log(`[KodikAPI Client] Используемый API_BASE: ${API_BASE}`);

const apiClient = axios.create({
    baseURL: API_BASE, // Используем относительный путь
    timeout: 65000, // Увеличенный таймаут
});

// Обработчик ошибок Kodik
const handleKodikError = (error, context = 'Kodik API Client') => {
    console.error(`[${context}] Ошибка запроса:`, error.response?.status, error.code, error.message, error.config);
    let message = error.response?.data?.message || error.message || 'Неизвестная ошибка сети или Kodik API';
    // Упрощаем, т.к. ошибки могут быть от Nginx или бэкенда
    if (error.response?.status === 404) { message = `Ресурс плеера не найден (${error.config.url})`; }
    else if (error.response?.status >= 500) { message = `Ошибка сервера (${error.response.status}) при запросе к API плеера.`; }
    else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) { message = `Превышено время ожидания ответа от сервера (${(error.config?.timeout || 65000) / 1000} сек)`; }
    else if (error.message === 'Network Error') { message = 'Ошибка сети. Проверьте подключение или доступность сервера.'; }
    // Сообщение от нашего бэкенда
    else if (error.response?.data?.message && typeof error.response.data.message === 'string') { message = error.response.data.message; }
    return { kodik_link: null, id: null, error: new Error(message) };
};


// Функция searchKodikPlayer (без изменений в логике)
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
};с