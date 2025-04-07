import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const AUTH_URL = `${API_URL}/auth`;
const USERS_URL = `${API_URL}/users`;

/**
 * Регистрация пользователя
 * @param {object} userData - Данные пользователя { tagPart, email, password } // <<<--- ОЖИДАЕМ tagPart
 * @returns {Promise<object>} - Промис с ответом от сервера { token, user, message }
 */
export const registerUser = async (userData) => {
    // --- ИЗМЕНЕНИЕ: Логгируем userData, ожидая tagPart ---
    if (import.meta.env.DEV) {
        console.log('Вызов РЕАЛЬНОГО registerUser с данными:', userData);
    }
    // --- Конец изменения ---

    // --- ИЗМЕНЕНИЕ: Проверяем наличие tagPart ---
    if (!userData.tagPart || !userData.email || !userData.password) {
        console.error("Ошибка в данных для регистрации:", userData);
        throw new Error("Внутренняя ошибка: не все данные переданы для регистрации.");
    }
    // --- Конец изменения ---

    try {
        // --- ИЗМЕНЕНИЕ: Отправляем userData как есть (ожидаем, что там tagPart) ---
        const response = await axios.post(`${AUTH_URL}/register`, userData);
        // --- Конец изменения ---

        if (response.data && response.data.token && response.data.user) {
            localStorage.setItem('authToken', response.data.token);
            return response.data;
        } else {
            throw new Error('Некорректный ответ сервера при регистрации');
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Неизвестная ошибка регистрации';
        console.error('Ошибка API регистрации:', message, error.response?.data);
        throw new Error(message);
    }
};

/**
 * Вход пользователя
 * @param {object} credentials - Учетные данные { loginIdentifier, password }
 * @returns {Promise<object>} - Промис с ответом от сервера { token, user, message }
 */
export const loginUser = async (credentials) => {
    if (import.meta.env.DEV) {
        console.log('Вызов РЕАЛЬНОГО loginUser', credentials);
    }
    try {
        const response = await axios.post(`${AUTH_URL}/login`, credentials);
        if (response.data && response.data.token && response.data.user) {
            localStorage.setItem('authToken', response.data.token);
            if (import.meta.env.DEV) {
                console.log("Токен сохранен в localStorage:", localStorage.getItem('authToken'));
            }
            return response.data;
        } else {
            throw new Error('Некорректный ответ сервера при входе');
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Неизвестная ошибка входа';
        console.error('Ошибка API входа:', message, error.response?.data);
        throw new Error(message);
    }
};

/**
 * Выход пользователя (очистка токена)
 */
export const logoutUser = () => {
    localStorage.removeItem('authToken');
    if (import.meta.env.DEV) {
        console.log('Пользователь вышел (токен удален из localStorage)');
    }
};

/**
 * Получение данных текущего пользователя по токену
 * @returns {Promise<object | null>} - Промис с данными пользователя или null
 */
export const getMe = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return null;
    }
    if (import.meta.env.DEV) {
        console.log('Вызов РЕАЛЬНОГО getMe с токеном:', token ? 'есть' : 'нет');
    }

    try {
        const response = await axios.get(`${USERS_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Ошибка API getMe:', error.response?.data?.message || error.message);
        logoutUser();
        return null;
    }
};