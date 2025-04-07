import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const USERS_URL = `${API_URL}/users`;

/**
 * Получение публичного профиля пользователя по части тега (без @)
 * @param {string} tagPart - Часть тега пользователя (например, "User123")
 * @returns {Promise<object>} - Промис с публичными данными пользователя
 */
export const getUserProfileByTagPart = async (tagPart) => {
    if (!tagPart) {
        throw new Error('Тег пользователя не указан');
    }
    if (import.meta.env.DEV) {
        console.log(`Вызов getUserProfileByTagPart для части тега: ${tagPart}`);
    }
    try {
        const response = await axios.get(`${USERS_URL}/tag/${encodeURIComponent(tagPart)}`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Неизвестная ошибка получения профиля';
        console.error(`Ошибка API getUserProfileByTagPart (${tagPart}):`, message, error.response?.data);
        if (error.response?.status === 404) {
            throw new Error('Пользователь не найден');
        }
        throw new Error(message);
    }
};

/**
 * Обновление профиля текущего аутентифицированного пользователя
 * @param {object} updateData - Объект с данными для обновления (например, { nickname: "Новый ник" })
 * @returns {Promise<object>} - Промис с обновленными данными пользователя
 */
export const updateMyProfile = async (updateData) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('Необходима аутентификация для обновления профиля');
    }
    if (import.meta.env.DEV) {
        console.log('Вызов РЕАЛЬНОГО updateMyProfile с данными:', updateData);
    }
    try {
        // Отправляем PUT запрос на /api/users/me
        const response = await axios.put(`${USERS_URL}/me`, updateData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        // Ожидаем обновленные данные пользователя в ответе
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Неизвестная ошибка обновления профиля';
        console.error('Ошибка API updateMyProfile:', message, error.response?.data);
        throw new Error(message);
    }
};