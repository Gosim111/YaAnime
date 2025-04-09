// [client/src/services/kodikApi.js]

import axios from 'axios';

// !!! Используем переменную окружения для базового URL API !!!
const API_PROXY_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({
    // Добавляем /api/kodik к базовому URL
    baseURL: `${API_PROXY_URL}/api/kodik`,
    timeout: 65000, // !!! ТАЙМАУТ КЛИЕНТА KODIK 65 СЕК !!!
});

// Обработчик ошибок Kodik
const handleKodikError = (error, context = 'Kodik API Client') => {
    console.error(`[${context}] Ошибка запроса:`, error.response?.status, error.code, error.message);
    let message = error.response?.data?.message || error.message || 'Неизвестная ошибка сети или Kodik API';
    if (error.response?.data?.message && error.response?.data?.message.startsWith('Kodik API Error:')) { message = error.response.data.message.replace('Kodik API Error:', '').trim(); }
    else if (error.response?.data?.message && error.response?.data?.message.startsWith('Gateway Timeout:')) { message = error.response.data.message; }
    else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) { message = `Превышено время ожидания ответа (${(error.config?.timeout || 65000) / 1000} сек)`; }
    else if (error.response?.status >= 500) { message = `Ошибка сервера (${error.response.status}) при запросе к Kodik.`; }
    return { kodik_link: null, id: null, error: new Error(message) };
};

// Функция searchKodikPlayer (использует apiClient)
export const searchKodikPlayer = async (params = {}) => {
    const hasSearchParam = params.shikimori_id || params.kinopoisk_id || params.imdb_id || params.title;
    if (!hasSearchParam) { return { kodik_link: null, id: null, error: new Error("Для поиска Kodik нужен ID или title") }; }
    const requestParams = { limit: 1, with_material_data: false, ...params };
    try {
        const response = await apiClient.get('/search', { params: requestParams });
        if (response.data && Array.isArray(response.data.results) && response.data.results.length > 0) {
            const bestResult = response.data.results[0];
            const playerLink = bestResult.link && String(bestResult.link).trim() ? `https:${bestResult.link}` : null;
            if (playerLink) { return { kodik_link: playerLink, id: bestResult.id, error: null }; }
            else { return { kodik_link: null, id: bestResult.id, error: new Error('Плеер найден, но ссылка недействительна') }; }
        } else { const errorMessage = response.data?.results?.length === 0 ? 'Плеер Kodik не найден' : 'Некорректный ответ от Kodik API /search'; return { kodik_link: null, id: null, error: new Error(errorMessage) }; }
    } catch (error) { return handleKodikError(error, 'searchKodikPlayer'); }
};