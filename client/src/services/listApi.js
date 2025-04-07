import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const USERS_URL = `${API_URL}/users`;

/**
 * Получить список аниме пользователя по части тега
 * @param {string} tagPart - Часть тега без '@'
 * @param {string} [status] - Опциональный статус для фильтрации ('watching', 'planned', etc.)
 * @returns {Promise<Array>} - Промис со списком аниме
 */
export const fetchUserAnimeList = async (tagPart, status) => {
    if (!tagPart) throw new Error('Тег пользователя не указан');

    const params = {};
    if (status) {
        params.status = status;
    }
    if (import.meta.env.DEV) {
        console.log(`[listApi] Запрос списка для ${tagPart} со статусом ${status || 'any'}`);
    }
    try {
        const response = await axios.get(`${USERS_URL}/tag/${encodeURIComponent(tagPart)}/list`, { params });
        // Ожидаем ответ вида { list: [...] }
        return response.data?.list || []; // Возвращаем массив или пустой массив
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Неизвестная ошибка получения списка';
        console.error(`[listApi] Ошибка fetchUserAnimeList (${tagPart}, ${status}):`, message, error.response?.data);
        throw new Error(message);
    }
};

/**
 * Обновить или добавить аниме в список текущего пользователя
 * @param {number} kitsuId - ID аниме из Kitsu
 * @param {object} listData - Данные для обновления { status?, rating?, progress? }
 * @returns {Promise<object>} - Промис с обновленной/добавленной записью списка
 */
export const updateMyListItem = async (kitsuId, listData) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Необходима аутентификация');
    if (!kitsuId) throw new Error('Не указан ID аниме');

    if (import.meta.env.DEV) {
        console.log(`[listApi] Обновление/добавление для kitsuId ${kitsuId} с данными:`, listData);
    }
    try {
        const response = await axios.put(`${USERS_URL}/me/list/${kitsuId}`, listData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // Ожидаем обновленную/созданную запись
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Неизвестная ошибка обновления списка';
        console.error(`[listApi] Ошибка updateMyListItem (${kitsuId}):`, message, error.response?.data);
        throw new Error(message);
    }
};

/**
 * Удалить аниме из списка текущего пользователя
 * @param {number} kitsuId - ID аниме из Kitsu
 * @returns {Promise<object>} - Промис с сообщением об успехе
 */
export const deleteMyListItem = async (kitsuId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Необходима аутентификация');
    if (!kitsuId) throw new Error('Не указан ID аниме');

    if (import.meta.env.DEV) {
        console.log(`[listApi] Удаление для kitsuId ${kitsuId}`);
    }
    try {
        const response = await axios.delete(`${USERS_URL}/me/list/${kitsuId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // Ожидаем сообщение об успехе
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Неизвестная ошибка удаления из списка';
        console.error(`[listApi] Ошибка deleteMyListItem (${kitsuId}):`, message, error.response?.data);
        throw new Error(message);
    }
};