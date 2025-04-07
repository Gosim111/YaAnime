const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { jwtSecret, jwtExpiration } = require('../config/db');

// Функция генерации JWT (без изменений)
const generateToken = (id) => {
    return jwt.sign({ id }, jwtSecret, {
        expiresIn: jwtExpiration,
    });
};

// @desc    Регистрация нового пользователя
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
    // --- ИЗМЕНЕНИЕ: Ожидаем tagPart без @ ---
    const { tagPart, email, password } = req.body;
    // --- Конец изменения ---

    // Формируем полный тег для валидации и сохранения
    const tag = tagPart ? `@${tagPart}` : '';

    // --- Валидация входных данных ---
    if (!tagPart || !email || !password) { // <<<--- Проверяем tagPart
        return res.status(400).json({ message: 'Пожалуйста, заполните все поля (тег, email, пароль)' });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Пожалуйста, введите корректный email' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
    }
    // Валидируем полный тег
    if (!/^@[a-zA-Z0-9_]{3,20}$/.test(tag) || !/[a-zA-Z]/.test(tagPart)) {
        return res.status(400).json({ message: 'Неверный формат тега. Требования: 3-20 символов (латиница, цифры, _), должна быть хотя бы одна буква.' });
    }
    // --- Конец валидации ---

    try {
        // Проверяем уникальность email и полного тега
        let userByEmail = await User.findOne({ email: email.toLowerCase() });
        if (userByEmail) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }
        let userByTag = await User.findOne({ tag }); // <<<--- Ищем по полному тегу
        if (userByTag) {
            return res.status(400).json({ message: 'Пользователь с таким тегом уже существует' });
        }

        // Создаем пользователя с полным тегом, nickname = null
        const user = new User({
            tag, // <<<--- Сохраняем полный тег
            email: email.toLowerCase(),
            password,
            nickname: null
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                tag: user.tag, // Возвращаем полный тег
                nickname: user.nickname,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
            message: 'Регистрация прошла успешно'
        });

    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        if (error.code === 11000) {
            if (error.keyPattern?.email) {
                return res.status(400).json({ message: 'Пользователь с таким email уже существует.' });
            }
            if (error.keyPattern?.tag) {
                return res.status(400).json({ message: 'Пользователь с таким тегом уже существует.' });
            }
        }
        next(error);
    }
};

// @desc    Аутентификация пользователя и получение токена
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
    const { loginIdentifier, password } = req.body;

    if (!loginIdentifier || !password) {
        return res.status(400).json({ message: 'Пожалуйста, введите email/тег и пароль' });
    }

    try {
        const isLoginEmail = validator.isEmail(loginIdentifier);
        let query = {};

        if (isLoginEmail) {
            query = { email: loginIdentifier.toLowerCase() };
        } else {
            // Если не email, считаем, что это тег. Добавляем @ если его нет
            const potentialTag = loginIdentifier.startsWith('@') ? loginIdentifier : `@${loginIdentifier}`;
            query = { tag: potentialTag };
        }

        const user = await User.findOne(query).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Неверный email/тег или пароль' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                nickname: user.nickname,
                tag: user.tag,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
            message: 'Вход выполнен успешно'
        });

    } catch (error) {
        console.error('Ошибка при входе:', error);
        next(error);
    }
};