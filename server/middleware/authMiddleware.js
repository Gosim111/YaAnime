const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

// Проверяем наличие токена в заголовке Authorization
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Извлекаем токен ('Bearer TOKEN')
            token = req.headers.authorization.split(' ')[1];

            // Верифицируем токен
            const decoded = jwt.verify(token, jwtSecret);

            // Находим пользователя по ID из токена, исключая пароль
            // Добавляем найденного пользователя в объект запроса (req.user)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                // Если пользователь не найден (например, удален после выдачи токена)
                return res.status(401).json({ message: 'Не авторизован, пользователь не найден' });
            }

            next(); // Переходим к следующему middleware или роуту
        } catch (error) {
            console.error('Ошибка верификации токена:', error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Не авторизован, невалидный токен' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Не авторизован, срок действия токена истек' });
            }
            // Другие ошибки
            return res.status(401).json({ message: 'Не авторизован, ошибка токена' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Не авторизован, токен отсутствует' });
    }};

module.exports = protect;